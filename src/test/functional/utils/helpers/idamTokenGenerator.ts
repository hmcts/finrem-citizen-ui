/* eslint-disable no-console */
import { chromium } from '@playwright/test';
import axios from 'axios';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env file
dotenv.config();

/** * Simple logger to satisfy CI visibility requirements.
 * 'no-console' is disabled for this file to allow orchestration logging.
 */
const logger = {
  info: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

function loadEnvWithExports(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
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

const TOKEN_FILE = path.resolve(process.cwd(), '.auth-tokens.json');

export interface StoredTokens {
  cookieToken: string;
  cookieUserId: string;
  timestamp: number;
}

export function loadStoredTokens(): StoredTokens | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      if (data.timestamp && Date.now() - data.timestamp < 7 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

function saveTokens(tokens: StoredTokens): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

async function createTestCaseworker(): Promise<{ username: string; password: string; userId: string }> {
  const clientSecret = process.env.FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET;
  const clientId = 'finrem-citizen-ui';
  
  if (!clientSecret) {
    throw new Error('FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET not set - cannot create test user');
  }
  
  logger.info('📝 Getting IDAM client token...');
  const tokenResponse = await axios.post(
    'https://idam-web-public.aat.platform.hmcts.net/o/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'profile roles',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  
  const adminToken = tokenResponse.data.access_token;
  const username = `finrem-caseworker-${randomUUID()}@mailinator.com`;
  const password = 'Password123!';
  
  logger.info(`👤 Creating test caseworker: ${username}`);
  const createUserResponse = await axios.post(
    'https://idam-testing-support-api.aat.platform.hmcts.net/test/idam/users',
    {
      password,
      user: {
        email: username,
        forename: 'Test',
        surname: 'Caseworker',
        roleNames: [
          'caseworker',
          'caseworker-divorce',
          'caseworker-divorce-financialremedy',
          'caseworker-divorce-financialremedy-courtadmin',
          'caseworker-divorce-financialremedy-solicitor',
          'pui-case-manager',
          'pui-user-manager'
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const userId = createUserResponse.data.id;
  logger.info(`✓ Created caseworker with UUID: ${userId}`);
  
  return { username, password, userId };
}

async function getUserTokenViaPasswordGrant(username: string, password: string): Promise<string> {
  const clientSecret = process.env.FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET;
  const clientId = 'finrem-citizen-ui';
  
  const response = await axios.post(
    'https://idam-web-public.aat.platform.hmcts.net/o/token',
    new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret || '',
      username,
      password,
      scope: 'openid profile roles',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  
  return response.data.access_token;
}

async function globalSetup(): Promise<void> {
  logger.info('🔐 Running IDAM token setup...');

  const cached = loadStoredTokens();
  const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  if (cached && isValidUuid(cached.cookieUserId)) {
    logger.info('✓ Using cached IDAM tokens (less than 7 hours old)');
    return;
  }

  const existingToken = process.env.COOKIE_TOKEN;
  if (existingToken && existingToken !== '__auth__' && existingToken.length > 50) {
    const existingUserId = process.env.COOKIE_USER_ID || '';
    if (existingUserId && existingUserId !== '__userid__' && isValidUuid(existingUserId)) {
      saveTokens({
        cookieToken: existingToken,
        cookieUserId: existingUserId,
        timestamp: Date.now()
      });
      logger.info('✓ Using IDAM tokens from environment');
      return;
    }
  }

  try {
    const { username, password, userId } = await createTestCaseworker();
    
    logger.info('🔑 Getting user access token...');
    const userToken = await getUserTokenViaPasswordGrant(username, password);
    
    saveTokens({
      cookieToken: userToken,
      cookieUserId: userId,
      timestamp: Date.now()
    });
    
    logger.info('✓ IDAM tokens saved');
    logger.info(`✓ User ID: ${userId}`);
  } catch (error) {
    logger.error('❌ Failed to create test caseworker:', error);
    logger.info('⚠️  Falling back to browser login...');
    await browserLogin();
  }
}

async function browserLogin(): Promise<void> {
  const username = process.env.USERNAME_CASEWORKER || process.env.CASEWORKER_USERNAME;
  const password = process.env.PASSWORD_CASEWORKER || process.env.CASEWORKER_PASSWORD;

  if (!username || !password) {
    logger.warn('⚠️  No caseworker credentials found in environment.');
    return;
  }

  logger.info(`🔑 Logging in as caseworker: ${username}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const manageCaseUrl = 'https://manage-case.aat.platform.hmcts.net';
    await page.goto(manageCaseUrl);
    await page.waitForSelector('input[id="username"]', { timeout: 30000 });
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="password"]', password);
    await page.click('input[type="submit"]');
    await page.waitForURL(/manage-case/, { timeout: 30000 });

    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === '__auth__');

    if (authCookie) {
      const detailsResponse = await axios.get('https://idam-api.aat.platform.hmcts.net/details', {
        headers: { Authorization: `Bearer ${authCookie.value}` }
      });
      
      const userId = detailsResponse.data.id;
      saveTokens({
        cookieToken: authCookie.value,
        cookieUserId: userId,
        timestamp: Date.now()
      });
      logger.info(`✓ Tokens saved. User ID: ${userId}`);
    } else {
      logger.warn('⚠️  Could not extract __auth__ cookie');
    }
  } catch (error) {
    logger.error('❌ Browser login failed:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;