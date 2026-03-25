import { APIRequestContext, request } from '@playwright/test';
import { randomUUID } from 'crypto';

import { UserCredentials } from '../../../functional/pom/idamPage.page';

// IDAM environment configuration - defaults to AAT
const IDAM_ENV = process.env.IDAM_ENV || 'aat';
const IDAM_WEB_URL = process.env.IDAM_WEB_URL || `https://idam-web-public.${IDAM_ENV}.platform.hmcts.net`;
const IDAM_TESTING_SUPPORT_API_URL = process.env.IDAM_TESTING_SUPPORT_API_URL || `https://idam-testing-support-api.${IDAM_ENV}.platform.hmcts.net`;

// Default password for test users - should be overridden in CI/CD environments
const DEFAULT_TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1111';

export class IdamApiService {
  private readonly createTokenEndpoint = `${IDAM_WEB_URL}/o/token`;
  private readonly createUserEndpoint = `${IDAM_TESTING_SUPPORT_API_URL}/test/idam/users`;

  async createCitizenUser(): Promise<UserCredentials> {
    const apiContext = await request.newContext();

    const user: UserCredentials = {
      username: `finrem-test-${randomUUID()}@mailinator.com`,
      password: DEFAULT_TEST_USER_PASSWORD,
    };

    const accessToken = await this.getAccessToken(apiContext);
    await this.provisionUser(apiContext, accessToken, user, 'Test', 'User');

    return user;
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
