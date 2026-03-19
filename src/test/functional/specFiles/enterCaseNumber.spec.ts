import { expect, test } from '../../fixtures/fixtures';

const dataFactory = {
  generateDigits: (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join(''),
  validFormatted: (base: string) => {
    // Formats a 16-digit string into XXXX-XXXX-XXXX-XXXX
    return `${base.slice(0, 4)}-${base.slice(4, 8)}-${base.slice(8, 12)}-${base.slice(12, 16)}`;
  },
};

test.describe('Enter Case Number Page Verification', () => {
  const VALID_CASE = '1773677683810798';
  // need to skip until we have a valid case number in the test environment that we can use for the happy path test

  test.beforeEach(async ({ loggedInPage: _loggedInPage, enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
  });

  // --- SUCCESS & BOUNDARY HAPPY PATHS ---
  const happyPaths = [
    { desc: '16 digits (Standard Boundary)', value: VALID_CASE },
    { desc: '16 digits with hyphens', value: dataFactory.validFormatted(VALID_CASE) },
  ];

  for (const { desc, value } of happyPaths) {
    test.skip(`Happy Path: ${desc} @PR`, async ({ page, enterCaseNumberPage }) => {
      await enterCaseNumberPage.submitCaseNumber(value);

      // Verify redirection to Access Code page
      await expect(page).toHaveURL(/\/enter-access-code$/);
      await expect(page.locator('body')).toContainText('This is a placeholder page for the access code step');
    });
  }

  /**
   * Note: The 20-digit Upper Boundary is a "Logic Success" (No length error)
   * but a "Functional Failure" (No DB record exists for a random 20-digit string).
   */
  test('Success Logic: 20 digits (Upper Boundary) @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(20));

    // Confirm that the length-specific validation is NOT triggered
    await enterCaseNumberPage.expectNoSpecificValidationErrors(['Case number must be between 16 and 20 characters']);

    // We expect the "Not Found" error because this random 20-digit ID doesn't exist in DB
    await enterCaseNumberPage.expectValidationError('Case number must be 16 digits');
  });

  // --- VALIDATION ERROR SCENARIOS ---

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
});
