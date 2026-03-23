import { test as base } from '@playwright/test';
import { AxeUtils } from '@hmcts/playwright-common';

import { BasePage } from '../functional/pom/basePage.page';
import { EnterCaseNumberPage } from '../functional/pom/enterCaseNumber.page';
import { IdamPage, UserCredentials } from '../functional/pom/idamPage.page';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

export type AuthSession = {
  user: UserCredentials;
  authStatus: 'success' | 'failure';
};

type MyFixtures = {
  idamApiService: IdamApiService;
  citizenUser: UserCredentials;
  idamPage: IdamPage;
  basePage: BasePage;
  loggedInPage: AuthSession;
  enterCaseNumberPage: EnterCaseNumberPage;
  axeUtils: AxeUtils; 
};

export const test = base.extend<MyFixtures>({
  axeUtils: async ({ page }, use) => {
    const axeUtils = new AxeUtils(page);
    await use(axeUtils);
  },

  idamApiService: async ({}, use) => {
    await use(new IdamApiService());
  },

  idamPage: async ({ page }, use) => {
    await use(new IdamPage(page));
  },

  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },

  citizenUser: async ({ idamApiService }, use) => {
    const user = await idamApiService.createCitizenUser();
    await use(user);
  },

  loggedInPage: async ({ idamPage, citizenUser, basePage }, use) => {
    await basePage.goto();
    await idamPage.login(citizenUser);
    // TO DO Add post-login assertion here
    // await expect(page).toHaveURL(/.*dashboard/); 
    await use({ user: citizenUser, authStatus: 'success' });
  },

  enterCaseNumberPage: async ({ page }, use) => {
    await use(new EnterCaseNumberPage(page));
  },
});

export { expect } from '@playwright/test';