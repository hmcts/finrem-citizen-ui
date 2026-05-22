import { expect, test } from '../../../fixtures/fixtures';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';

/**
 * INTEGRATION TESTS: Enter Case Number
 * 
 * These tests verify case number happy-path integration logic.
 * Real integration tests create actual CCD cases and verify successful submissions.
 *
 * Runs on: Environments with reachable real CCD dependencies when ACCESS_CODE_REAL_INTEGRATION=true
 * Default: Skipped to keep local/dev runs deterministic and avoid fragile external dependency failures
 */

const runIntegration = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';

test.describe('[integration-happy-path] Enter Case Number - Happy Path', () => {
  test.skip(
    !runIntegration,
    'Skipped by default: real CCD case-creation happy-path is opt-in. Set ACCESS_CODE_REAL_INTEGRATION=true to enable in preview/AAT or configured integration environments.'
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
