import { randomUUID } from 'crypto';

import { APIRequestContext, request } from '@playwright/test';

import { UserCredentials } from '../../../functional/pom/idamPage.page';

export class IdamApiService {
  private readonly tokenUrl = 'https://idam-web-public.aat.platform.hmcts.net/o/token';
  private readonly testSupportUrl = 'https://idam-testing-support-api.aat.platform.hmcts.net/test/idam/users';

  async createCitizenUser(): Promise<UserCredentials> {
    const apiContext = await request.newContext();

    const firstNames = ['James', 'Emma', 'Oliver', 'Sophia', 'Liam', 'Ava', 'Noah'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];

    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomNum = Math.floor(Math.random() * 9000) + 1000;

    const user: UserCredentials = {
      username: `${first.toLowerCase()}${last.toLowerCase()}${randomNum}@mailinator.com`,
      password: 'Password1111',
    };

    const accessToken = await this.getAccessToken(apiContext);
    await this.provisionUser(apiContext, accessToken, user, first, last);

    return user;
  }

  private async getAccessToken(apiContext: APIRequestContext): Promise<string> {
    const clientSecret = process.env.IDAM_CITIZEN_CLIENT_SECRET;
    const clientId = 'finrem-citizen-ui';

    if (!clientSecret) {
      throw new Error('MISSING CONFIG: IDAM_CITIZEN_CLIENT_SECRET is not defined in the environment.');
    }

    const response = await apiContext.post(this.tokenUrl, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      form: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'profile roles',
      },
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      throw new Error(`IDAM Token Error: ${response.status()} - ${errorBody}`);
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
    const response = await apiContext.post(this.testSupportUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        password: user.password,
        user: {
          id: randomUUID(),
          email: user.username,
          forename: first,
          surname: last,
          roleNames: ['citizen'],
        },
      },
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`User Creation Error: ${response.status()} - ${errorText}`);
    }
  }
}
