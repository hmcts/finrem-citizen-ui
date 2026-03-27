import { request } from '@playwright/test';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import fs from 'fs-extra';
import { set, unset } from 'lodash';
import { createGuardrails, generate } from 'otplib';
import path from 'path';
import lockfile from 'proper-lockfile';

import { UserCredentials } from '../../../functional/pom/idamPage.page';

// Stub for loadStoredTokens - returns null to fall through to env variables
function loadStoredTokens(): { cookieToken: string; cookieUserId: string } | null {
  return null;
}

// Custom guardrails to allow shorter S2S secrets (10 bytes instead of 16)
const s2sGuardrails = createGuardrails({ MIN_SECRET_BYTES: 1 });

// Default password for test users
const DEFAULT_TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1111';

// Parse export-prefixed env variables
function loadEnvWithExports(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)=["']?([^"'\n]*)["']?$/i);
      if (match) {
        const [, key, value] = match;
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnvWithExports();

export interface CaseCreationConfig {
  caseType: string;
  eventId: string;
  dataLocation: string;
  dataModifications?: ReplacementAction[];
}

export interface CaseCreationResponse {
  caseId: string;
  success: boolean;
  message: string;
}

interface ReplacementAction {
  action: 'insert' | 'delete';
  key: string;
  value?: unknown;
}

interface CachedToken {
  token: string;
  expiry: number;
  userId: string;
}

interface ApiConfig {
  idam: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
  };
  ccd: {
    dataStoreApi: string;
  };
}

const getEnvironment = (): string => {
  // Check for PR/preview environment
  if (process.env.RUNNING_ENV?.startsWith('pr-')) {
    return 'preview';
  }
  return process.env.RUNNING_ENV || 'aat';
};

const getConfig = (): ApiConfig => {
  if (!process.env.IDAM_CLIENT_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  IDAM_CLIENT_SECRET not set - authentication may fail');
  }

  const env = getEnvironment();
  
  // Shared services use AAT for both AAT and preview environments
  // Preview apps connect to the same AAT backend services
  const serviceEnv = env === 'preview' ? 'aat' : env;
  
  return {
    idam: {
      baseUrl: process.env.IDAM_API_URL || `https://idam-api.${serviceEnv}.platform.hmcts.net`,
      clientId: process.env.IDAM_CLIENT_ID || 'divorce',
      clientSecret: process.env.IDAM_CLIENT_SECRET || ''
    },
    ccd: {
      dataStoreApi: `https://ccd-data-store-api-finrem-ccd-definitions-pr-3089.preview.platform.hmcts.net`
    }
  };
};

const CACHE_PATH = path.resolve(process.cwd(), '.ccd-token-cache.json');

async function readTokenCache(): Promise<Map<string, CachedToken>> {
  try {
    const release = await lockfile.lock(CACHE_PATH, { retries: 5 });
    const exists = await fs.pathExists(CACHE_PATH);
    if (!exists) {
      await release();
      return new Map();
    }
    const data = await fs.readJson(CACHE_PATH);
    await release();
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

async function writeTokenCache(cache: Map<string, CachedToken>): Promise<void> {
  try {
    const release = await lockfile.lock(CACHE_PATH, { retries: 5 });
    const obj = Object.fromEntries(cache);
    await fs.writeJson(CACHE_PATH, obj, { spaces: 2 });
    await release();
  } catch {
    // Silently fail if write fails
  }
}

async function axiosRequest<T = unknown>(
  requestParams: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  try {
    const response = await axios(requestParams);
    if (![200, 201].includes(response.status)) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const details = typeof data === 'object' ? JSON.stringify(data) : (data || error.message);
      throw new Error(`Request to ${requestParams.url} failed (${status}): ${details}`);
    }
    throw new Error(`Request to ${requestParams.url} failed: ${String(error)}`);
  }
}

async function getUserToken(): Promise<string> {
  const cacheKey = 'default_user';
  const tokenCache = await readTokenCache();
  const cached = tokenCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiry > now) {
    return cached.token;
  }

  // First, try to load tokens from the file created by globalSetup
  const storedTokens = loadStoredTokens();
  if (storedTokens) {
    tokenCache.set(cacheKey, {
      token: storedTokens.cookieToken,
      expiry: now + 3600000, // 1 hour
      userId: storedTokens.cookieUserId
    });
    await writeTokenCache(tokenCache);
    return storedTokens.cookieToken;
  }

  // Fallback to environment variables
  const envToken = process.env.COOKIE_TOKEN || 
                   process.env.USER_TOKEN ||
                   process.env.IDAM_USER_TOKEN;
  
  if (envToken && envToken !== '__auth__' && envToken.length > 50) {
    tokenCache.set(cacheKey, {
      token: envToken,
      expiry: now + 3600000, // 1 hour
      userId: cached?.userId || process.env.COOKIE_USER_ID || ''
    });
    await writeTokenCache(tokenCache);
    return envToken;
  }

  throw new Error(
    'No valid user token found.'
  );
}

async function getUserId(authToken: string): Promise<string> {
  const config = getConfig();
  const cacheKey = 'default_user';
  
  // UUID format: 8-4-4-4-12 hex characters
  const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  // First check if userId is in cache
  const tokenCache = await readTokenCache();
  const cached = tokenCache.get(cacheKey);
  if (cached?.userId && cached.userId.length > 5) {
    // Accept any userId from cache (may be UUID or numeric)
    return cached.userId;
  }

  // Check stored tokens from globalSetup
  const storedTokens = loadStoredTokens();
  if (storedTokens?.cookieUserId && storedTokens.cookieUserId.length > 5) {
    // Accept any userId from globalSetup (may be UUID or numeric)
    if (cached) {
      cached.userId = storedTokens.cookieUserId;
      await writeTokenCache(tokenCache);
    }
    return storedTokens.cookieUserId;
  }

  // Check environment variable
  const envUserId = process.env.COOKIE_USER_ID;
  if (envUserId && envUserId !== '__userid__' && envUserId.length > 5) {
    // Update cache with userId
    if (cached) {
      cached.userId = envUserId;
      await writeTokenCache(tokenCache);
    }
    return envUserId;
  }

  // Fetch from IDAM - try /details first (returns UUID), then /o/userinfo
  try {
    // Try /details endpoint first
    try {
      const detailsResponse = await axiosRequest<{ id: string }>({
        method: 'get',
        url: `${config.idam.baseUrl}/details`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      const userId = detailsResponse.data.id;
      if (userId && isValidUuid(userId)) {
        if (cached) {
          cached.userId = userId;
          await writeTokenCache(tokenCache);
        }
        return userId;
      }
    } catch {
      // Fall through to /o/userinfo
    }
    
    // Fallback to /o/userinfo - use 'uid' field only (sub is email address)
    const response = await axiosRequest<{ uid: string }>({
      method: 'get',
      url: `${config.idam.baseUrl}/o/userinfo`,
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    const userId = response.data.uid;
      // eslint-disable-next-line no-console
    console.log(`✓ Got user ID from IDAM: ${userId}`);
    
    // Update cache with userId
    if (cached) {
      cached.userId = userId;
      await writeTokenCache(tokenCache);
    }
    
    return userId;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get user ID: ${message}`);
  }
}

async function getServiceToken(): Promise<string> {
  // Check if token already provided
  const existingToken = process.env.S2S_SERVICE;
  if (existingToken && existingToken.startsWith('eyJ')) {
    return existingToken;
  }

  // Generate S2S token using TOTP
  const s2sSecret = process.env.FINREM_CASE_ORCHESTRATION_SERVICE_S2S_KEY
    || process.env.SERVICE_AUTH_SECRET 
    || process.env.S2S_SECRET;
  if (!s2sSecret) {
    throw new Error(
      'Missing S2S secret. Set one of: S2S_SECRET, SERVICE_AUTH_SECRET, or FINREM_CASE_ORCHESTRATION_SERVICE_S2S_KEY'
    );
  }

  // Use configured S2S URL or derive from environment
  const env = getEnvironment();
  const serviceEnv = env === 'preview' ? 'aat' : env;
  const s2sUrl = process.env.S2S_URL || `http://rpe-service-auth-provider-${serviceEnv}.service.core-compute-${serviceEnv}.internal`;
  const microservice = 'finrem_case_orchestration';

  try {
    // Generate TOTP using otplib with custom guardrails for shorter HMCTS secrets
    const otp = await generate({ secret: s2sSecret, guardrails: s2sGuardrails });

    // Request S2S token
    const response = await axios.post<string>(
      `${s2sUrl}/lease`,
      {
        microservice,
        oneTimePassword: otp
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const token = response.data;
    // Cache for future requests in this run
    process.env.S2S_SERVICE = token;
      // eslint-disable-next-line no-console
    console.log('✓ S2S token generated successfully');
    return token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const details = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      throw new Error(`Failed to generate S2S token (${error.response?.status}): ${details}`);
    }
    throw new Error(`Failed to generate S2S token: ${String(error)}`);
  }
}

function loadCaseData(dataLocation: string): Record<string, unknown> {
  try {
    const rawData = readFileSync(path.resolve(dataLocation), 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load case data from ${dataLocation}: ${message}`);
  }
}

function applyModifications(modifications: ReplacementAction[], data: Record<string, unknown>): void {
  if (Array.isArray(modifications)) {
    modifications.forEach(({ action, key, value }) => {
      if (!key) {return;}
      if (action === 'delete') {
        unset(data, key);
      } else if (action === 'insert') {
        set(data, key, value);
      }
    });
  }
}

async function createCaseViaApi(config: CaseCreationConfig): Promise<string> {
  const apiConfig = getConfig();

  // eslint-disable-next-line no-console
  console.log(`Creating case with event: ${config.eventId}`);

  const authToken = await getUserToken();
  const userId = await getUserId(authToken);
  const serviceToken = await getServiceToken();

  const startPath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${config.caseType}/event-triggers/${config.eventId}/token`;
  const savePath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${config.caseType}/cases`;

  const tokenResponse = await axiosRequest<{ token: string }>({
    method: 'get',
    url: apiConfig.ccd.dataStoreApi + startPath,
    headers: {
      Authorization: `Bearer ${authToken}`,
      ServiceAuthorization: `Bearer ${serviceToken}`,
      'Content-Type': 'application/json'
    }
  });

  const eventToken = tokenResponse.data.token;
  const caseData = loadCaseData(config.dataLocation);

  if (config.dataModifications && config.dataModifications.length > 0) {
    applyModifications(config.dataModifications, caseData);
  }

  const payload = {
    data: caseData,
    event: {
      id: config.eventId,
      summary: 'Creating Case',
      description: 'Created via API'
    },
    event_token: eventToken
  };

  const createResponse = await axiosRequest<{ id: string }>({
    method: 'post',
    url: apiConfig.ccd.dataStoreApi + savePath,
    data: payload,
    headers: {
      Authorization: `Bearer ${authToken}`,
      ServiceAuthorization: `Bearer ${serviceToken}`,
      'Content-Type': 'application/json'
    }
  });

  const caseId = String(createResponse.data.id);
  // eslint-disable-next-line no-console
  console.log(`✓ Case created: ${caseId}`);
  return caseId;
}

export async function createCase(config: CaseCreationConfig): Promise<string> {
  return createCaseViaApi(config);
}

export async function createCaseWithResponse(
  config: CaseCreationConfig
): Promise<CaseCreationResponse> {
  try {
    const caseId = await createCaseViaApi(config);
    return {
      caseId,
      success: true,
      message: `Case created successfully: ${caseId}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      caseId: '',
      success: false,
      message: `Failed to create case: ${message}`
    };
  }
}

export class IdamApiService {
  private readonly createUserEndpoint: string;

  constructor() {
    const env = getEnvironment();
    const serviceEnv = env === 'preview' ? 'aat' : env;
    this.createUserEndpoint = process.env.IDAM_TESTING_SUPPORT_URL || 
      `https://idam-testing-support-api.${serviceEnv}.platform.hmcts.net/test/idam/users`;
  }

  async createCitizenUser(): Promise<UserCredentials> {
    const apiContext = await request.newContext();

    const user: UserCredentials = {
      username: `finrem-test-${randomUUID()}@mailinator.com`,
      password: DEFAULT_TEST_USER_PASSWORD,
    };

    // IDAM Testing Support API doesn't require OAuth token for user creation
    const response = await apiContext.post(this.createUserEndpoint, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        password: user.password,
        user: {
          email: user.username,
          forename: 'Test',
          surname: 'User',
          roleNames: ['citizen'],
        },
      },
    });

    if (!response.ok()) {
      throw new Error(`User Creation Error: ${response.status()} - ${await response.text()}`);
    }

    return user;
  }
}