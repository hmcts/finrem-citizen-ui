import { Page, test as base } from '@playwright/test'; 

import { BasePage } from '../functional/pom/basePage.page';
import { EnterCaseNumberPage } from '../functional/pom/enterCaseNumber.page';
import { IdamPage, UserCredentials } from '../functional/pom/idamPage.page';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

/** * Define the shape of the authentication session object.
 */
export type AuthSession = {
  page: Page; // Changed from any to Page
  user: UserCredentials;
  authStatus: 'success' | 'failure';
};

/** * Extend the base MyFixtures type to include Page Objects and Services.
 */
type MyFixtures = {
  idamApiService: IdamApiService;
  citizenUser: UserCredentials;
  idamPage: IdamPage;
  basePage: BasePage;
  loggedInPage: AuthSession;
  enterCaseNumberPage: EnterCaseNumberPage;
};

export const test = base.extend<MyFixtures>({
  idamApiService: async ({}, use) => {
    await use(new IdamApiService());
  },

  idamPage: async ({ page }, use) => {
    await use(new IdamPage(page));
  },

  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },

  /** DATA FIXTURE: Creates a new citizen user in IDAM.
   * Test-scoped, a unique user is created for every test that requests 'loggedInPage'.
   */
  citizenUser: async ({ idamApiService }, use) => {
    const user = await idamApiService.createCitizenUser();
    await use(user);
  },

  /** LOGIN FIXTURE: Performs the login flow.
   */
  loggedInPage: async ({ page, idamPage, citizenUser, basePage }, use) => {
    // Navigate and log in
    await basePage.goto();
    await idamPage.login(citizenUser);
    await use({ page, user: citizenUser, authStatus: 'success' });
  },

  enterCaseNumberPage: async ({ page }, use) => {
    await use(new EnterCaseNumberPage(page));
  },
});

export { expect } from '@playwright/test';