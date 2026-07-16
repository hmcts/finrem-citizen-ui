import { expect, test } from '../../../fixtures/fixtures';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';

function shouldRunHappyPathIntegrationSuite(): boolean {
  const explicitToggle = process.env.ACCESS_CODE_REAL_INTEGRATION;
  const runningEnv = (process.env.RUNNING_ENV || '').toLowerCase();
  const testUrl = (process.env.TEST_URL || '').toLowerCase();
  const isPreviewOrAatTarget =
    runningEnv === 'aat'
    || runningEnv.startsWith('pr-')
    || testUrl.includes('.preview.platform.hmcts.net')
    || testUrl.includes('.aat.platform.hmcts.net');

  if (explicitToggle === 'true') {
    return true;
  }

  if (explicitToggle === 'false') {
    // Legacy .env files often set false; do not block preview/AAT by default.
    return isPreviewOrAatTarget;
  }

  return isPreviewOrAatTarget;
}

/**
 * INTEGRATION TESTS: Enter Case Number
 *
 * These tests verify the case-number happy path using the shared fixtures.
 * `contestedCaseForCaseNumber` provisions case prerequisites and
 * `loggedInPage` provisions an authenticated citizen session.
 *
 * Runs on: AAT/preview by default (or any target when ACCESS_CODE_REAL_INTEGRATION=true)
 * Default: Skipped outside preview/AAT unless ACCESS_CODE_REAL_INTEGRATION=true.
 * ACCESS_CODE_REAL_INTEGRATION=false is treated as legacy local default and
 * does not disable AAT/preview happy-path runs.
 */

const runIntegration = shouldRunHappyPathIntegrationSuite();

test.describe('[integration-happy-path] Enter Case Number - Happy Path', () => {
  test.skip(
    !runIntegration,
    'Skipped outside preview/AAT by default. Set ACCESS_CODE_REAL_INTEGRATION=true to force enable on non-preview/non-AAT targets.'
  );

  test.describe.configure({ mode: 'serial' });

  /**
   * This test creates a real contested case via API (caseworker creates it with hearing date),
   * then logs in as a citizen and submits the case number.
   */
  test('[integration-happy-path] Citizen can enter a valid case number created via API @a11y', async ({
    loggedInPage,
    basePage,
    enterCaseNumberPage,
    contestedCaseForCaseNumber,
    page,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await basePage.verifyGlobalHeaderAndFooter();
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await runA11yAudit(axeUtils);
  });

  test('[integration-happy-path] Citizen can enter formatted case number (with hyphens) @a11y', async ({
    loggedInPage,
    basePage,
    enterCaseNumberPage,
    contestedCaseForCaseNumber,
    page,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await basePage.verifyGlobalHeaderAndFooter();
    // Use the formatted case ID (XXXX-XXXX-XXXX-XXXX)
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.formattedCaseId);
    // Verify redirection to Access Code page
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Enter access code' })).toBeVisible();
    await runA11yAudit(axeUtils);
  });
});
