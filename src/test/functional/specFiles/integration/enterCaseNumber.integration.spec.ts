import { expect, test } from '../../../fixtures/fixtures';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';

/**
 * INTEGRATION TESTS: Enter Case Number
 * 
 * These tests verify case number happy-path integration logic.
 * Real integration tests create actual CCD cases and verify successful submissions.
 *
 * Runs on: AAT/preview by default (or any target when ACCESS_CODE_REAL_INTEGRATION=true)
 * Default: Skipped outside preview/AAT unless ACCESS_CODE_REAL_INTEGRATION=true.
 * ACCESS_CODE_REAL_INTEGRATION=false is treated as legacy local default and
 * does not disable AAT/preview happy-path runs.
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
