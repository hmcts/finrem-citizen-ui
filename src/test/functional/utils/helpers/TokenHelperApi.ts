import { existsSync, readFileSync } from 'fs';
import { createGuardrails, generate } from 'otplib';
import path from 'path';

import config from '../../config/config';
import { axiosRequest } from './ApiHelper';

// Create custom guardrails to allow shorter HMCTS S2S secrets (10 bytes instead of 16)
const s2sGuardrails = createGuardrails({ MIN_SECRET_BYTES: 1 });

const SENSITIVE_TEXT_PATTERN = /(Bearer\s+[A-Za-z0-9\-._~+/]+=*)|(access_token\"?\s*[:=]\s*\"?[^\"\s]+\"?)|(refresh_token\"?\s*[:=]\s*\"?[^\"\s]+\"?)|(client_secret\"?\s*[:=]\s*\"?[^\"\s]+\"?)|(oneTimePassword\"?\s*[:=]\s*\"?[^\"\s]+\"?)/gi;

function sanitizeErrorText(value: string): string {
  return value.replace(SENSITIVE_TEXT_PATTERN, '[REDACTED]');
}

// Load .env file handling both 'export KEY=VALUE' and 'KEY=VALUE' formats
function ensureEnvLoaded(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)=["']?([^"'\r\n]*)["']?$/i);
      if (match) {
        const [, key, value] = match;
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Ensure env is loaded on module init
ensureEnvLoaded();

// Cache tokens to avoid repeated API calls
const tokenCache: Record<string, { token: string; expiry: number }> = {};
const TOKEN_BUFFER_MS = 60000; // Refresh 1 minute before expiry

/**
 * Gets a service-to-service (S2S) token for authenticating with HMCTS services
 */
export async function getServiceToken(): Promise<string> {
  // Check cache first
  const cached = tokenCache['s2s'];
  if (cached && Date.now() < cached.expiry - TOKEN_BUFFER_MS) {
    return cached.token;
  }

  // Check environment for pre-existing token
  if (process.env.S2S_SERVICE_TOKEN) {
    return process.env.S2S_SERVICE_TOKEN;
  }

  const s2sSecret = process.env.FINREM_CASE_ORCHESTRATION_SERVICE_S2S_KEY
    || process.env.SERVICE_AUTH_SECRET 
    || process.env.S2S_SECRET;
  
  if (!s2sSecret) {
    throw new Error(
      'Missing S2S secret. Set SERVICE_AUTH_SECRET (preferred), S2S_SECRET, or FINREM_CASE_ORCHESTRATION_SERVICE_S2S_KEY'
    );
  }

  try {
    // Generate TOTP using otplib with custom guardrails for shorter HMCTS secrets
    const otp = await generate({ secret: s2sSecret, guardrails: s2sGuardrails });

    // Request S2S token
    const response = await axiosRequest<string>({
      method: 'post',
      url: `${config.s2sUrl}/lease`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        microservice: config.microservice,
        oneTimePassword: otp,
      },
    });

    const token = response.data;

    // Cache the token (S2S tokens typically last 4 hours)
    tokenCache['s2s'] = {
      token,
      expiry: Date.now() + 4 * 60 * 60 * 1000,
    };

    return token;
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes('API request failed')) {
      throw error; // Re-throw API errors as-is
    }
    throw new Error(`Failed to generate S2S token: ${sanitizeErrorText(err.message || String(error))}`);
  }
}

/**
 * Gets a user access token from IDAM using password grant
 */
export async function getUserToken(username: string, password: string): Promise<string> {
  const cacheKey = `user:${username}`;
  const cached = tokenCache[cacheKey];
  
  if (cached && Date.now() < cached.expiry - TOKEN_BUFFER_MS) {
    return cached.token;
  }

  const response = await axiosRequest<{ access_token: string; expires_in: number }>({
    method: 'post',
    url: `${config.idamApi}/o/token`,
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: new URLSearchParams({
      grant_type: 'password',
      client_id: config.idam.clientId,
      client_secret: config.idam.clientSecret,
      redirect_uri: config.idam.redirectUri,
      scope: config.idam.scope,
      username,
      password,
    }).toString(),
  });

  const { access_token, expires_in } = response.data;

  // Cache the token
  tokenCache[cacheKey] = {
    token: access_token,
    expiry: Date.now() + (expires_in * 1000),
  };

  return access_token;
}

/**
 * Gets the user ID from IDAM using the access token
 */
export async function getUserId(accessToken: string, _email?: string): Promise<string> {
  const response = await axiosRequest<{ uid: string }>({
    method: 'get',
    url: `${config.idamApi}/o/userinfo`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.uid;
}

/**
 * Clear all cached tokens
 */
export function clearTokenCache(): void {
  Object.keys(tokenCache).forEach(key => delete tokenCache[key]);
}