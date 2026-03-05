import { expect, test } from '@playwright/test';

import { IdamApiService } from '../utils/helpers/idamCreateUser';

// just a test to confirm the IDAM API helper is working correctly and can create a user as expected.
// this will be deleted later on when we have the API helper fully integrated
test.describe('IDAM API Service Smoke Test', () => {
  const idamApi = new IdamApiService();

  test('should successfully create a new citizen user via API', async () => {
    const user = await idamApi.createCitizenUser();

    console.log(`Successfully created user: ${user.username}`);

    expect(user.username).toContain('@mailinator.com');
    expect(user.password).toBe('Password1111');
  });
});
