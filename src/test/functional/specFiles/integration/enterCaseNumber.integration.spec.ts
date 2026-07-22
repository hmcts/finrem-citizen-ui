import { expect, test } from '../../../fixtures/fixtures';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';

/**
 * INTEGRATION TESTS: Enter Case Number
 *
 * These tests verify the case-number happy path using the shared fixtures.
 * `contestedCaseForCaseNumber` provisions case prerequisites and
 * `loggedInPage` provisions an authenticated citizen session.
 *
 * Runs on: preview/AAT/perftest/ITHC by default, plus local when mock CCD is configured.
 * Default: skipped on demo; local runs require CCD_URL/CCD_DATA_STORE_API_URL -> http://localhost:4100.
 * ACCESS_CODE_REAL_INTEGRATION=false is treated as legacy local default and
 * does not disable known real-CCD targets.
 */

if (shouldRunRealCcdIntegrationSuite()) {
  test.describe('[integration-happy-path] Enter Case Number - Happy Path', () => {

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
}
