import { test as base } from '@playwright/test';

import { HomePage } from '../functional/pom/homePage.page';
import { IdamPage , UserCredentials } from '../functional/pom/idamPage.page';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

type MyFixtures = {
  idamApiService: IdamApiService;
  citizenUser: UserCredentials;
  idamPage: IdamPage;
  homePage: HomePage;
  loggedInPage: void;
};

export const test = base.extend<MyFixtures>({
  idamApiService: async ({}, use) => {
    await use(new IdamApiService());
  },

  idamPage: async ({ page }, use) => {
    await use(new IdamPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  // This fixture creates a fresh user for every test that uses it
  citizenUser: async ({ idamApiService }, use) => {
    const user = await idamApiService.createCitizenUser();
    await use(user);
  },

  // This fixture performs the login automatically
  loggedInPage: async ({ idamPage, citizenUser, homePage }, use) => {
    await homePage.goto();
    await idamPage.login(citizenUser);
    await use();
  },
});

export { expect } from '@playwright/test';
