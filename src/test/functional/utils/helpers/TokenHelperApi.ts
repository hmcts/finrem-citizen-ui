import { createHmac } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

import config from '../../config/config';
import { axiosRequest } from './ApiHelper';

/**
 * Generate TOTP code (RFC 6238) - implements our own to avoid otplib validation issues
 * HMCTS S2S secrets are shorter than otplib v13+ minimum requirement
 */
function generateTOTP(secret: string): string {
  // Decode base32 secret
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of secret.toUpperCase().replace(/=+$/, '')) {
    const val = base32chars.indexOf(char);
    if (val === -1) {continue;}
    bits += val.toString(2).padStart(5, '0');
  }
  const secretBytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let i = 0; i < secretBytes.length; i++) {
    secretBytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }

  // Get current time step (30 second window)
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(timeStep));

  // Generate HMAC-SHA1
  const hmac = createHmac('sha1', secretBytes);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
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

  const s2sSecret = process.env.S2S_SECRET || process.env.SERVICE_AUTH_SECRET;
  
  if (!s2sSecret) {
    throw new Error(
      'Missing S2S_SECRET or SERVICE_AUTH_SECRET environment variable. ' +
      'This is required for service-to-service authentication.'
    );
  }

  try {
    // Generate TOTP using our own implementation (no secret length validation)
    const otp = generateTOTP(s2sSecret);

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
    throw new Error(`Failed to generate S2S token: ${err.message}`);
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