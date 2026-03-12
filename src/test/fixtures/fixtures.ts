import { test as base } from '@playwright/test';

import { HomePage } from '../functional/pom/homePage.page';
import { IdamPage, UserCredentials } from '../functional/pom/idamPage.page';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

/** * Define the shape of the authentication session object.
 */
export type AuthSession = {
  user: UserCredentials;
  authStatus: 'success' | 'failure';
};

/** * Extend the base MyFixtures type to include Page Objects and Services.
 */
type MyFixtures = {
  idamApiService: IdamApiService;
  citizenUser: UserCredentials;
  idamPage: IdamPage;
  homePage: HomePage;
  loggedInPage: AuthSession;
};

/**
 * base.extend: This is where we define our custom "World."
 */
export const test = base.extend<MyFixtures>({
  // Initialize the API Helper service
  idamApiService: async ({}, use) => {
    await use(new IdamApiService());
  },

  // Initialize the IDAM Page Object with the current 'page'
  idamPage: async ({ page }, use) => {
    await use(new IdamPage(page));
  },

  // Initialize the Home Page Object with the current 'page'
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  /** DATA FIXTURE: Creates a new citizen user in IDAM.
   * Test-scoped, a unique user is created for every test that requests 'loggedInPage'.
   */
  citizenUser: async ({ idamApiService }, use) => {
    const user = await idamApiService.createCitizenUser();
    await use(user);
  },

  /** LOGIN FIXTURE: Performs the login flow.
   * This fixture 'depends' on idamPage, citizenUser, and homePage.
   */
  loggedInPage: async ({ idamPage, citizenUser, homePage }, use) => {
    // Navigate and log in
    await homePage.goto();
    await idamPage.login(citizenUser);

    // Pass the state to the test
    await use({ user: citizenUser, authStatus: 'success' });
  },
});

export { expect } from '@playwright/test';
