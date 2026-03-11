import { randomUUID } from 'crypto';

import { APIRequestContext, request } from '@playwright/test';

import { UserCredentials } from '../../../functional/pom/idamPage.page';

export class IdamApiService {
  private readonly idamWebUrl = process.env.IDAM_WEB_URL || 'https://idam-web-public.aat.platform.hmcts.net';
  private readonly idamTestApiUrl =
    process.env.IDAM_TESTING_SUPPORT_API_URL || 'https://idam-testing-support-api.aat.platform.hmcts.net';

  private readonly createTokenEndpoint = `${this.idamWebUrl}/o/token`;
  private readonly createUserEndpoint = `${this.idamTestApiUrl}/test/idam/users`;

  async createCitizenUser(): Promise<UserCredentials> {
    const apiContext = await request.newContext();

    const user: UserCredentials = {
      username: `finrem-test-${randomUUID()}@mailinator.com`,
      password: 'Password1111',
    };

    const accessToken = await this.getAccessToken(apiContext);
    await this.provisionUser(apiContext, accessToken, user, 'Test', 'User');

    return user;
  }

  private async getAccessToken(apiContext: APIRequestContext): Promise<string> {
    const clientSecret = process.env.FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET;
    const clientId = 'finrem-citizen-ui';

    if (!clientSecret) {
      throw new Error(
        'CRITICAL FAILURE: FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET is missing. ' +
          'Ensure loadVaultSecrets is working in Jenkins and the secret is mapped to this env var.'
      );
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
      // Log the URL to help debug if it's hitting the wrong endpoint in the pipeline
      throw new Error(
        `IDAM Token Error at ${this.createTokenEndpoint}: ${response.status()} - ${await response.text()}`
      );
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
