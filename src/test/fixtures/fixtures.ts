import { AxeUtils } from '@hmcts/playwright-common';
import { test as base } from '@playwright/test';

import { BasePage } from '../functional/pom/basePage.page';
import { EnterAccessCodePage } from '../functional/pom/enterAccessCode.page';
import { EnterCaseNumberPage } from '../functional/pom/enterCaseNumber.page';
import { IdamPage, UserCredentials } from '../functional/pom/idamPage.page';
import { ContestedCaseFactory } from '../functional/utils/factories/contested/ContestedCaseFactory';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

/**
 * Define the shape of the authentication session object.
 */
export type AuthSession = {
  user: UserCredentials;
  authStatus: 'success' | 'failure';
};

/**
 * Created case data shape
 */
export type CreatedCase = {
  caseId: string;
  formattedCaseId: string;
};

/**
 * Extend the base MyFixtures type to include Page Objects and Services.
 */
type MyFixtures = {
  idamApiService: IdamApiService;
  citizenUser: UserCredentials;
  idamPage: IdamPage;
  basePage: BasePage;
  loggedInPage: AuthSession;
  enterCaseNumberPage: EnterCaseNumberPage;
  enterAccessCodePage: EnterAccessCodePage;
  contestedCaseWithHearing: CreatedCase;
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

  /** DATA FIXTURE: Creates a new citizen user in IDAM.
   * Test-scoped, a unique user is created for every test that requests 'loggedInPage'.
   */
  citizenUser: async ({ idamApiService }, use) => {
    const user = await idamApiService.createCitizenUser();
    await use(user);
  },

  /** LOGIN FIXTURE: Performs the login flow.
   */
  // TO DO: Add a post-login assertion inside the fixture to confirm successful login.
  loggedInPage: async ({ idamPage, citizenUser, basePage }, use) => {
    // Navigate and log in
    await basePage.goto();
    await idamPage.login(citizenUser);

    await use({ user: citizenUser, authStatus: 'success' });
  },

  enterCaseNumberPage: async ({ page }, use) => {
    await use(new EnterCaseNumberPage(page));
  },

  enterAccessCodePage: async ({ page }, use) => {
    await use(new EnterAccessCodePage(page));
  },

  /**
   * CASE CREATION FIXTURE: Creates a contested case with hearing date via API.
   * This creates a real case in CCD that can be used for testing.
   * Timeout increased to 90s to accommodate API calls and CCD consistency waits.
   */
  contestedCaseWithHearing: [
    async ({}, use) => {
      // CCD IDs are explicitly converted to strings at API level (CcdApi.ts)
      // to prevent precision loss on 16-digit numbers exceeding JavaScript's safe integer limit
      const caseId = String(await ContestedCaseFactory.createContestedCaseWithHearing());

      // Format case ID with hyphens (XXXX-XXXX-XXXX-XXXX)
      const formattedCaseId = caseId.replace(/(\d{4})(?=\d)/g, '$1-');

      await use({ caseId, formattedCaseId });
    },
    { timeout: 90 * 1000 }
  ],
});

export { expect } from '@playwright/test';
