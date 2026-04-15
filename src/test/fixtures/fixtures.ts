import { AxeUtils } from '@hmcts/playwright-common';
import { expect, test as base } from '@playwright/test';

import { BasePage } from '../functional/pom/basePage.page';
import { DashboardPage } from '../functional/pom/dashboardPage.page';
import { EnterAccessCodePage } from '../functional/pom/enterAccessCode.page';
import { EnterCaseNumberPage } from '../functional/pom/enterCaseNumber.page';
import { IdamPage, UserCredentials } from '../functional/pom/idamPage.page';
import { ContestedCaseFactory } from '../functional/utils/factories/contested/ContestedCaseFactory';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

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
  /** Page-object wrapper around the IDAM login UI. */
  idamPage: IdamPage;
  /** Generic base page wrapper (headings, footer etc.). */
  basePage: BasePage;
  /** Page-object wrapper for the case dashboard. */
  dashboardPage: DashboardPage;
  /** Completes the full OIDC login flow (landing on the dashboard) */
  loggedInPage: AuthSession;
  /** Page-object wrapper for the enter-case-number screen. */
  enterCaseNumberPage: EnterCaseNumberPage;
  /** Page-object wrapper for the enter-access-code screen. */
  enterAccessCodePage: EnterAccessCodePage;
  /** A real contested case used solely for case-number linking tests (no access codes). */
  contestedCaseForCaseNumber: CreatedCase;
  /** A real contested case pre-loaded with deterministic mock access codes. */
  contestedCaseWithHearing: CreatedCaseWithAccessCodes;
  /** Axe accessibility test utilities bound to the current page. */
  axeUtils: AxeUtils;
};

export const test = base.extend<MyFixtures>({
  // Bind Axe to the current Playwright page so any test can run accessibility audits.
  axeUtils: async ({ page }, use) => {
    const axeUtils = new AxeUtils(page);
    await use(axeUtils);
  },

  // Provides a raw IDAM API client; injected into fixtures that need to manage users.
  idamApiService: async ({}, use) => {
    await use(new IdamApiService());
  },

  // Page-object for the IDAM login screen; used by loggedInPage to drive authentication.
  idamPage: async ({ page }, use) => {
    await use(new IdamPage(page));
  },

  // Generic page helpers shared across multiple screens (e.g. main headings, footer).
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },

  // Page-object for the case dashboard, used by tests that navigate post-login.
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
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
      const caseId = String(
        await ContestedCaseFactory.createAndProcessFormACaseUpToProgressToListing(false)
      );
      const formattedCaseId = caseId.replace(/(\d{4})(?=\d)/g, '$1-');
      await use({ caseId, formattedCaseId });
    },
    { timeout: 240 * 1000 }
  ],

  /**
   * Creates a real contested case and injects deterministic mock access codes
   * directly via /__test/inject-case-session in 'test-support.ts', bypassing the Form C /
   * FR_manageHearings callback entirely.  This makes the fixture faster and
   * removes the dependency on manage-hearings being available in the environment.
   *
   * Both applicant and respondent access codes are returned so tests can verify
   * each role's happy path without sharing state.
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
