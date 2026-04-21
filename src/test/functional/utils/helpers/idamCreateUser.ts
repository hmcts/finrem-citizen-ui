import { randomUUID } from 'node:crypto';

import { APIRequestContext, request } from '@playwright/test';

import { UserCredentials } from '../../../functional/pom/idamPage.page';

// IDAM environment configuration - defaults to AAT
const IDAM_ENV = process.env.IDAM_ENV || 'aat';
const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

const IDAM_WEB_URL = stripTrailingSlash(
  process.env.IDAM_WEB_URL || `https://idam-web-public.${IDAM_ENV}.platform.hmcts.net`
);

const IDAM_TESTING_SUPPORT_API_URL = stripTrailingSlash(
  process.env.IDAM_TESTING_SUPPORT_API_URL
    || process.env.IDAM_TESTING_SUPPORT_URL
    || `https://idam-testing-support-api.${IDAM_ENV}.platform.hmcts.net`
);

// Default password for test users - should be overridden in CI/CD environments
const DEFAULT_TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1111';

const IDAM_RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 1_000,
  maxDelayMs: 4_000,
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export class IdamApiService {
  private readonly createTokenEndpoint = `${IDAM_WEB_URL}/o/token`;
  private readonly createUserEndpoint = `${IDAM_TESTING_SUPPORT_API_URL}/test/idam/users`;

  async createCitizenUser(): Promise<UserCredentials> {
    const apiContext = await request.newContext();

    try {
      const user: UserCredentials = {
        username: `finrem-test-${randomUUID()}@mailinator.com`,
        password: DEFAULT_TEST_USER_PASSWORD,
      };

      await this.withRetry(async () => {
        const accessToken = await this.getAccessToken(apiContext);
        await this.provisionUser(apiContext, accessToken, user, 'Test', 'User');
      }, 'IDAM test user provisioning');

      return user;
    } finally {
      await apiContext.dispose();
    }
  }

  private isRetryableError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('ECONNRESET') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT') ||
      message.includes('socket hang up') ||
      /IDAM (Token|User Creation) Error: 5\d\d/.test(message)
    );
  }

  private async withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= IDAM_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryableError(error) || attempt === IDAM_RETRY_CONFIG.maxRetries) {
          throw error;
        }

        const delayMs = Math.min(
          IDAM_RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
          IDAM_RETRY_CONFIG.maxDelayMs
        );

        const message = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console
        console.warn(
          `[IdamApiService] ${label} transient failure "${message}" ` +
          `(attempt ${attempt + 1}/${IDAM_RETRY_CONFIG.maxRetries + 1}), retrying in ${delayMs}ms`
        );
        await sleep(delayMs);
      }
    }

    throw lastError;
  }

  private async getAccessToken(apiContext: APIRequestContext): Promise<string> {
    const clientSecret = process.env.FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET;
    const clientId = 'finrem-citizen-ui';

    if (!clientSecret) {
      throw new Error('MISSING CONFIG: FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET is not defined.');
    }

    const response = await apiContext.post(this.createTokenEndpoint, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      form: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'profile roles',
      },
    });

    if (!response.ok()) {
      throw new Error(`IDAM Token Error: ${response.status()} - ${await response.text()}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  private async provisionUser(
    apiContext: APIRequestContext,
    token: string,
    user: UserCredentials,
    first: string,
    last: string
  ) {
    const response = await apiContext.post(this.createUserEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        password: user.password,
        user: {
          email: user.username,
          forename: first,
          surname: last,
          roleNames: ['citizen'],
        },
      },
    });

    if (!response.ok()) {
      throw new Error(`User Creation Error: ${response.status()} - ${await response.text()}`);
    }
  }
}
