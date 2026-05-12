import { DEFAULT_AXE_OPTIONS, expect, test } from '../../../fixtures/fixtures';

/**
 * INTEGRATION TESTS: Enter Case Number
 * 
 * These tests verify case number entry and validation logic.
 * Real integration tests create actual CCD cases and verify happy-path submissions.
 * Validation tests are environment-agnostic (no real case needed).
 * 
 * Runs on: All environments (validation tests always run)
 * Runs on: All environments when ACCESS_CODE_REAL_INTEGRATION=true (happy-path tests)
 * Happy-path tests skipped by default: Requires real CCD integration
 */

const runIntegration = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';

const dataFactory = {
  generateDigits: (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join(''),
  validFormatted: (base: string) => {
    // Formats a 16-digit string into XXXX-XXXX-XXXX-XXXX
    return `${base.slice(0, 4)}-${base.slice(4, 8)}-${base.slice(8, 12)}-${base.slice(12, 16)}`;
  },
};

test.describe('[integration] Enter Case Number - Citizen Happy Path', () => {
  test.skip(
    !runIntegration,
    'Integration disabled by default. Set ACCESS_CODE_REAL_INTEGRATION=true for end-to-end case entry flow.'
  );

  test.describe.configure({ mode: 'serial' });

  /**
   * This test creates a real contested case via API (caseworker creates it with hearing date),
   * then logs in as a citizen and submits the case number.
   */
  test('[integration] Citizen can enter a valid case number created via API', async ({
    loggedInPage: _loggedInPage,
    basePage,
    enterCaseNumberPage,
    contestedCaseForCaseNumber,
    assertionHelpers: _assertionHelpers,
    page,
  }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await basePage.verifyGlobalHeaderAndFooter();
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);
  });

  test('[integration] Citizen can enter formatted case number (with hyphens)', async ({
    loggedInPage: _loggedInPage,
    basePage,
    enterCaseNumberPage,
    contestedCaseForCaseNumber,
    assertionHelpers: _assertionHelpers,
    page,
  }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await basePage.verifyGlobalHeaderAndFooter();
    // Use the formatted case ID (XXXX-XXXX-XXXX-XXXX)
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.formattedCaseId);
    // Verify redirection to Access Code page
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await expect(page.locator('h1')).toContainText('Enter access code');
  });
});

test.describe('[mock] Enter Case Number Page Verification - Validation Errors', () => {
  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    assertionHelpers: _assertionHelpers,
    basePage,
  }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await basePage.verifyGlobalHeaderAndFooter();
  });

  // --- VALIDATION ERROR SCENARIOS (no real case needed) ---

  test('[mock] Error: Empty input @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber('');
    await enterCaseNumberPage.expectValidationError('Enter your case number');
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[mock] Error: Boundary check - 15 characters (Lower Boundary - 1) @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(15));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[mock] Error: Boundary check - 21 characters (Upper Boundary + 1) @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(21));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[mock] Error: Invalid format - Letters @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber('1234-5678-ABCD-EFGH');
    await enterCaseNumberPage.expectValidationError(
      'Case number must only include numbers 0 to 9 and special characters such as hyphens'
    );
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[mock] Error: Case number not found @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber('1111222233334444');
    await enterCaseNumberPage.expectValidationError(
      'We cannot find that case number, Enter the case number that you received from the court'
    );
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  /**
   * Note: 20-digit is valid length but won't exist in DB - tests length validation passes
   */
  test('[mock] Success Logic: 20 digits (Upper Boundary) @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(20));

    // Confirm that the length-specific validation is NOT triggered
    await enterCaseNumberPage.expectNoSpecificValidationErrors(['Case number must be between 16 and 20 characters']);

    // We expect the "Not Found" error because this random 20-digit ID doesn't exist in DB
    await enterCaseNumberPage.expectValidationError('Case number must be 16 digits');
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});
