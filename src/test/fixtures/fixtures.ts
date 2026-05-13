import { AxeUtils } from '@hmcts/playwright-common';
import { expect, test as base } from '@playwright/test';
import dotenv from 'dotenv';

import { BasePage } from '../functional/pom/basePage.page';
import { BeforeYouStartPage } from '../functional/pom/beforeYouStart.page';
import { ConfidentialityPage } from '../functional/pom/confidentialityPage.page';
import { DashboardPage } from '../functional/pom/dashboardPage.page';
import { DocumentSelectionPage } from '../functional/pom/documentSelectionPage.page';
import { EnterAccessCodePage } from '../functional/pom/enterAccessCode.page';
import { EnterCaseNumberPage } from '../functional/pom/enterCaseNumber.page';
import { FdrPage } from '../functional/pom/fdrPage.page';
import { IdamPage, UserCredentials } from '../functional/pom/idamPage.page';
import { ContestedCaseFactory } from '../functional/utils/factories/contested/ContestedCaseFactory';
import {
  AssertionHelpers,
  createAssertionHelpers,
} from '../functional/utils/helpers/assertionHelpers';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

dotenv.config({ quiet: true });

function getConfiguredCcdUrl(): string {
  return (
    process.env.CCD_URL
    || process.env.CCD_DATA_STORE_API_URL
    || ''
  ).trim();
}

function isLocalMockCcdUrl(url: string): boolean {
  return /https?:\/\/(localhost|127\.0\.0\.1):4100\b/i.test(url);
}

function getMockSeedCase(): CreatedCaseWithAccessCodes {
  const caseId = process.env.MOCK_CASE_ID || '1616591401473378';

  return {
    caseId,
    formattedCaseId: caseId.replaceAll(/(\d{4})(?=\d)/g, '$1-'),
    applicantAccessCode: process.env.MOCK_APPLICANT_ACCESS_CODE || 'APPCODE1',
    respondentAccessCode: process.env.MOCK_RESPONDENT_ACCESS_CODE || 'RSPCODE1',
  };
}


/**
 * Shared axe audit options used by all @a11y tests.
 *
 * `target-size` (axe rule id, WCAG 2.5.8) is disabled because the violation
 * originates in standard GOV.UK Frontend components (.govuk-service-navigation__link,
 * .govuk-button) whose rendered height/spacing falls below the 24px minimum at the
 * version currently in use (govuk-frontend v6.1.0). This is not something we can
 * fix in this codebase. Re-evaluate when upgrading govuk-frontend.
 */
export const DEFAULT_AXE_OPTIONS = { disableRules: 'target-size' } as const;

/**
 * The result of a completed login attempt.
 * Passed to tests via the `loggedInPage` fixture so they can reference the
 * logged-in user's credentials without repeating the login flow.
 */
export type AuthSession = {
  user: UserCredentials;
  authStatus: 'success' | 'failure';
};

/**
 * Bare minimum case data shared by all case-creation fixtures.
 * `caseId` is the raw 16-digit identifier; 
 * `formattedCaseId` is the hyphen-separated display form (e.g. 1234-5678-9012-3456).
 */
export type CreatedCase = {
  caseId: string;
  formattedCaseId: string;
};

/**
 * Extends `CreatedCase` with the access codes needed to test the
 * "enter access code" journey.  Both applicant and respondent codes are
 * returned so tests can exercise each role independently.
 */
export type CreatedCaseWithAccessCodes = CreatedCase & {
  applicantAccessCode: string;
  respondentAccessCode: string;
};

/**
 * These are custom fixtures injected into functional specs via `test.extend`.
 * Each fixture is set up exactly once per test (or per worker for scoped ones)
 * and torn down automatically after the test completes.
 */
type MyFixtures = {
  /** IDAM API client used to create/delete test users. */
  idamApiService: IdamApiService;
  /** A freshly created IDAM citizen user scoped to the current test. */
  citizenUser: UserCredentials;
  idamPage: IdamPage;
  basePage: BasePage;
  dashboardPage: DashboardPage;
  /** Completes the full OIDC login flow (landing on the dashboard) */
  loggedInPage: AuthSession;
  enterCaseNumberPage: EnterCaseNumberPage;
  enterAccessCodePage: EnterAccessCodePage;
  /** A real contested case used solely for case-number linking tests (no access codes). */
  contestedCaseForCaseNumber: CreatedCase;
  /** A real contested case pre-loaded with deterministic mock access codes. */
  contestedCaseWithHearing: CreatedCaseWithAccessCodes;
  axeUtils: AxeUtils;
  beforeYouStartPage: BeforeYouStartPage;
  confidentialityPage: ConfidentialityPage;
  fdrPage: FdrPage;
  documentSelectionPage: DocumentSelectionPage;
  assertionHelpers: AssertionHelpers;
};

/**
 * Worker-scoped option that mock describe blocks set to `true` via `test.use()`.
 * Consumed by the `mockTestSupport` auto fixture which enforces the skip logic.
 */
type MockOptions = {
  useMockTestSupport: boolean;
  /**
   * Auto fixture that guards /__test/inject-case-session-dependent tests.
   * Activated when `useMockTestSupport` is set to `true` via `test.use()`.
   */
  mockTestSupport: void;
};

export const test = base.extend<MyFixtures & MockOptions>({
  useMockTestSupport: [false, { option: true }],

  // Guards mock tests that depend on /__test/inject-case-session.
  // Skip locally when targeting AAT; skip anywhere the route is absent (404).
  mockTestSupport: [async ({ request, useMockTestSupport }, use) => {
    if (!useMockTestSupport) {
      await use();
      return;
    }

    const configuredCcdUrl = getConfiguredCcdUrl();
    base.skip(
      !isLocalMockCcdUrl(configuredCcdUrl),
      '[mock] tests require CCD_URL (or CCD_DATA_STORE_API_URL) set to http://localhost:4100'
    );

    const response = await request.get('/__test/inject-case-session');
    base.skip(
      response.status() === 404,
      '[mock] tests require /__test/inject-case-session (ENABLE_TEST_SUPPORT_ROUTES=true)'
    );

    await use();
  }, { auto: true }],

  axeUtils: async ({ page }, use) => {
    const axeUtils = new AxeUtils(page);
    await use(axeUtils);
  },

  assertionHelpers: async ({}, use) => {
    await use(createAssertionHelpers());
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

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  beforeYouStartPage: async ({ page }, use) => {
    await use(new BeforeYouStartPage(page));
  },

  confidentialityPage: async ({ page }, use) => {
    await use(new ConfidentialityPage(page));
  },

  fdrPage: async ({ page }, use) => {
    await use(new FdrPage(page));
  },

  documentSelectionPage: async ({ page }, use) => {
    await use(new DocumentSelectionPage(page));
  },

  /**
   * Creates a unique IDAM citizen user for each test that requires it.
   * The user is created fresh per test 
   * Any fixture or test that depends on `citizenUser` or `loggedInPage` will automatically trigger this.
   */
  citizenUser: async ({ idamApiService }, use) => {
    const user = await idamApiService.createCitizenUser();
    await use(user);
  },

  /**
   * Completes the full OIDC login flow for a citizen user.  After the OIDC
   * callback the app redirects to the dashboard; this fixture then navigates
   * to /enter-case-number so every test starts from a known, consistent URL.
   *
   * Retry strategy: if the first attempt fails (e.g. a transient OIDC callback
   * error), the session is cleared and a second attempt is made automatically.
   * A descriptive error is thrown if both attempts fail to help diagnose issues in CI.
   *
   * Timeout is set to 90 s (3× the default) to give each of the two possible
   * login attempts enough time to complete their own internal waits (up to 30s
   * for the Sign-out link and 60s for the URL assertion) without the fixture
   * itself being stopped by the test-level timeout.
   */
  loggedInPage: [
    async ({ idamPage, citizenUser }, use) => {
      const completeLoginJourney = async (): Promise<void> => {
        await idamPage.page.goto('/');
        await idamPage.login(citizenUser);

        // Wait for the Sign out link to confirm the user is authenticated.
        await expect(
          idamPage.page.getByRole('link', { name: 'Sign out' })
        ).toBeVisible({ timeout: 30_000 });

        // Only navigate to /enter-case-number if we not already there;
        if (!/\/enter-case-number(?:\?.*)?$/.test(idamPage.page.url())) {
          await idamPage.page.goto('/enter-case-number');
        }

        // A "There was a problem with your request" banner means IDAM rejected
        // the authorize request — hard login failure.
        const problemCount = await idamPage.page
          .getByText('There was a problem with your request')
          .count();

        if (problemCount > 0) {
          throw new Error(
            `Login failed at IDAM authorize stage. Current URL: ${idamPage.page.url()}`
          );
        }

        // Final URL assertion confirms the auth accepted and redirected to the expected page
        await expect(idamPage.page).toHaveURL(/\/enter-case-number(?:\?.*)?$/, {
          timeout: 60_000,
        });
      };

      try {
        await completeLoginJourney();
      } catch (firstError) {
        // Clear any stale cookies/session storage before retrying (so clean state)
        try {
          await idamPage.clearSession();
        } catch (clearError) {
          if (clearError instanceof Error) {
            // eslint-disable-next-line no-console
            console.warn(`clearSession failed during retry setup: ${clearError.message}`);
          }
        }

        try {
          await completeLoginJourney();
          if (firstError instanceof Error) {
            // Log the original failure so it remains visible even though the retry succeeded
            // eslint-disable-next-line no-console
            console.warn(`Initial login attempt failed and succeeded on retry: ${firstError.message}`);
          }
        } catch (secondError) {
          const firstMessage = firstError instanceof Error ? firstError.message : String(firstError);
          const secondMessage = secondError instanceof Error ? secondError.message : String(secondError);
          throw new Error(
            `Login failed after one retry. First attempt: ${firstMessage}. Second attempt: ${secondMessage}`
          );
        }
      }

      await use({ user: citizenUser, authStatus: 'success' });
    },
    // 90 s covers two full login attempts (each up to 30s for Sign-out link + 60s for URL assertion) plus clearSession and network overhead.
    { timeout: 90_000 },
  ],

  // Page-object for the enter-case-number screen; used by case-linking tests.
  enterCaseNumberPage: async ({ page }, use) => {
    await use(new EnterCaseNumberPage(page));
  },

  // Page-object for the enter-access-code screen; used by access-code tests.
  enterAccessCodePage: async ({ page }, use) => {
    await use(new EnterAccessCodePage(page));
  },

  /**
   * Creates a real contested case via the Form A → progress-to-listing pipeline.
   * Access codes are NOT generated — this fixture is only for tests that verify
   * the case-number linking step without proceeding to the access-code screen.
   *
   * The 240s timeout reflects the time needed to drive the full case-creation API chain, which can be slow in the AAT environment.
   */
  contestedCaseForCaseNumber: [
    async ({}, use) => {
      if (isLocalMockCcdUrl(getConfiguredCcdUrl())) {
        const { caseId, formattedCaseId } = getMockSeedCase();
        await use({ caseId, formattedCaseId });
        return;
      }

      const caseId = String(
        await ContestedCaseFactory.createAndProcessFormACaseUpToProgressToListing(false)
      );
      const formattedCaseId = caseId.replaceAll(/(\d{4})(?=\d)/g, '$1-');
      await use({ caseId, formattedCaseId });
    },
    { timeout: 240 * 1000 }
  ],

  /**
   * Creates a contested case for the access-code journey using a mock-first strategy.
   *
   * Default: mock codes (APPCODE1/RSPCODE1) via /__test/inject-case-session,
   * which avoids Form C / FR_manageHearings instability and keeps tests deterministic.
   *
   * Optional real integration mode (happy path only): set
   *   ACCESS_CODE_REAL_INTEGRATION=true
   * to generate real Form C access codes at hearing time and fetch them from case details.
   *
   * Both applicant and respondent access codes are returned so tests can verify
   * each role's happy path without sharing state.
   */
  contestedCaseWithHearing: [
    async ({}, use) => {
      if (isLocalMockCcdUrl(getConfiguredCcdUrl())) {
        await use(getMockSeedCase());
        return;
      }

      const useRealIntegration = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';
      const caseData = await ContestedCaseFactory.createCaseForAccessCodeJourney(useRealIntegration);
      const formattedCaseId = caseData.caseId.replaceAll(/(\d{4})(?=\d)/g, '$1-');

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
