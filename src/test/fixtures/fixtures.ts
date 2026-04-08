import { AxeUtils } from '@hmcts/playwright-common';
import { expect, test as base } from '@playwright/test';

import { BasePage } from '../functional/pom/basePage.page';
import { EnterAccessCodePage } from '../functional/pom/enterAccessCode.page';
import { EnterCaseNumberPage } from '../functional/pom/enterCaseNumber.page';
import { IdamPage, UserCredentials } from '../functional/pom/idamPage.page';
import { ContestedCaseFactory } from '../functional/utils/factories/contested/ContestedCaseFactory';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

/**
 * Authentication state returned by the login fixture.
 */
export type AuthSession = {
  user: UserCredentials;
  authStatus: 'success' | 'failure';
};

/**
 * Minimal contested-case data used by tests that only need case-number linking.
 */
export type CreatedCase = {
  caseId: string;
  formattedCaseId: string;
};

/**
 * Contested-case data for access-code happy paths.
 * Access codes are expected to exist and are produced via manage-hearings/Form C flow.
 */
export type CreatedCaseWithAccessCodes = CreatedCase & {
  applicantAccessCode: string;
  respondentAccessCode: string;
};

/**
 * All custom fixtures available to functional specs.
 */
type MyFixtures = {
  idamApiService: IdamApiService;
  citizenUser: UserCredentials;
  idamPage: IdamPage;
  basePage: BasePage;
  loggedInPage: AuthSession;
  enterCaseNumberPage: EnterCaseNumberPage;
  enterAccessCodePage: EnterAccessCodePage;
  contestedCaseForCaseNumber: CreatedCase;
  contestedCaseWithHearing: CreatedCaseWithAccessCodes;
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

  /**
   * Creates a unique citizen user in IDAM for each test scope.
   * Any test that depends on loggedInPage will automatically trigger this fixture.
   */
  citizenUser: async ({ idamApiService }, use) => {
    const user = await idamApiService.createCitizenUser();
    await use(user);
  },

  /**
   * Performs citizen login and verifies the user lands on the case-number entry page.
   */
  loggedInPage: async ({ idamPage, citizenUser, basePage }, use) => {
    await basePage.goto();
    await idamPage.login(citizenUser);

    await expect(idamPage.page.getByRole('link', { name: 'Sign out' }))
      .toBeVisible();

    await basePage.goto('/enter-case-number');
    // Increased timeout for IDAM authorize / redirect flow
    await expect(idamPage.page).toHaveURL(/\/enter-case-number(?:\?.*)?$/, {
      timeout: 30_000,
    });

    await use({ user: citizenUser, authStatus: 'success' });
  },

  enterCaseNumberPage: async ({ page }, use) => {
    await use(new EnterCaseNumberPage(page));
  },

  enterAccessCodePage: async ({ page }, use) => {
    await use(new EnterAccessCodePage(page));
  },

  /**
   * Creates a contested case for case-number checks only.
   * This path does not require access-code generation.
   */
  contestedCaseForCaseNumber: [
    async ({}, use) => {
      const caseId = String(
        await ContestedCaseFactory.createAndProcessFormACaseUpToProgressToListing(false)
      );
      const formattedCaseId = caseId.replace(/(\d{4})(?=\d)/g, '$1-');
      await use({ caseId, formattedCaseId });
    },
    { timeout: 240 * 1000 }
  ],

  /**
   * Creates a real contested case and returns deterministic mock access codes.
   * Uses /__test/inject-case-session to bypass Form C / FR_manageHearings,
   * so this fixture no longer depends on the manage-hearings callback.
   */
  contestedCaseWithHearing: [
    async ({}, use) => {
      const caseData = await ContestedCaseFactory.createContestedCaseWithMockedAccessCode();
      const formattedCaseId = caseData.caseId.replace(/(\d{4})(?=\d)/g, '$1-');

      await use({
        caseId: caseData.caseId,
        formattedCaseId,
        applicantAccessCode: caseData.applicantCode,
        respondentAccessCode: caseData.respondentCode,
      });
    },
    { timeout: 240 * 1000 }
  ],
});

export { expect } from '@playwright/test';
