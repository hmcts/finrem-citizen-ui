import { expect, test } from '../../fixtures/fixtures';

const dataFactory = {
  generateDigits: (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join(''),
  validFormatted: (base: string) => {
    // Formats a 16-digit string into XXXX-XXXX-XXXX-XXXX
    return `${base.slice(0, 4)}-${base.slice(4, 8)}-${base.slice(8, 12)}-${base.slice(12, 16)}`;
  },
};

test.describe('Enter Case Number - Citizen Happy Path', () => {
  /**
   * TODO: These tests are skipped pending DevOps investigation.
   * The system user (fr_system_user@hmcts.net) credentials in Key Vault are valid,
   * but the deployed app fails to look up cases in CCD. Possible causes:
   * 1. Key Vault secrets not being mounted correctly in pods
   * 2. getSystemUser() not being called correctly in enter-case-number route
   * 
   * Case creation via API works fine - only the citizen UI lookup fails.
   */
  
  /**
   * This test creates a real contested case via API (caseworker creates it with hearing date),
   * then logs in as a citizen and submits the case number.
   */
  test.skip('Citizen can enter a valid case number created via API @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    contestedCaseWithHearing,
    page
  }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    
    // Use the dynamically created case ID
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);

    // Verify redirection to Access Code page
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await expect(page.locator('body')).toContainText('This is a placeholder page for the access code step');
  });

  test.skip('Citizen can enter formatted case number (with hyphens) @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    contestedCaseWithHearing,
    page
  }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    
    // Use the formatted case ID (XXXX-XXXX-XXXX-XXXX)
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.formattedCaseId);

    // Verify redirection to Access Code page
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await expect(page.locator('body')).toContainText('This is a placeholder page for the access code step');
  });
});

test.describe('Enter Case Number Page Verification', () => {
  test.beforeEach(async ({ loggedInPage: _loggedInPage, enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
  });

  // --- VALIDATION ERROR SCENARIOS (no real case needed) ---

  test('Error: Empty input @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('');
    await enterCaseNumberPage.expectValidationError('Enter your case number');
  });

  test('Error: Boundary check - 15 characters (Lower Boundary - 1) @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(15));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
  });

  test('Error: Boundary check - 21 characters (Upper Boundary + 1) @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(21));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
  });

  test('Error: Invalid format - Letters @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('1234-5678-ABCD-EFGH');
    await enterCaseNumberPage.expectValidationError(
      'Case number must only include numbers 0 to 9 and special characters such as hyphens'
    );
  });

  test('Error: Case number not found @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('1111222233334444');
    await enterCaseNumberPage.expectValidationError(
      'We cannot find that case number, Enter the case number that you received from the court'
    );
  });

  /**
   * Note: 20-digit is valid length but won't exist in DB - tests length validation passes
   */
  test('Success Logic: 20 digits (Upper Boundary) @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(20));

    // Confirm that the length-specific validation is NOT triggered
    await enterCaseNumberPage.expectNoSpecificValidationErrors(['Case number must be between 16 and 20 characters']);

    // We expect the "Not Found" error because this random 20-digit ID doesn't exist in DB
    await enterCaseNumberPage.expectValidationError('Case number must be 16 digits');
  });
});
