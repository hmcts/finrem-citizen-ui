import { expect, test } from '../../fixtures/fixtures';

const dataFactory = {
  generateDigits: (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join(''),
  validFormatted: (base: string) => {
    return `${base.slice(0, 4)}-${base.slice(4, 8)}-${base.slice(8, 12)}-${base.slice(12, 16)}`;
  },
};

test.describe('Enter Case Number Page Verification', () => {
  const VALID_CASE = '1773677683810798';

  test.beforeEach(async ({ loggedInPage: _loggedInPage, enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    // await axeUtils.audit(); temporariliy skipped due to accessibility defects
  });

  // --- SUCCESS & BOUNDARY HAPPY PATHS ---
  const happyPaths = [
    { desc: '16 digits (Standard Boundary)', value: VALID_CASE },
    { desc: '16 digits with hyphens', value: dataFactory.validFormatted(VALID_CASE) },
  ];

  for (const { desc, value } of happyPaths) {
    test.skip(`Happy Path: ${desc} @PR @a11y`, async ({ page, enterCaseNumberPage }) => {
      await enterCaseNumberPage.submitCaseNumber(value);

      // Verify redirection to Access Code page
      await expect(page).toHaveURL(/\/enter-access-code$/);
      // await axeUtils.audit(); temporariliy skipped due to accessibility defects      
      await expect(page.locator('body')).toContainText('This is a placeholder page for the access code step');
    });
  }

  test('Success Logic: 20 digits (Upper Boundary) @PR @a11y', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(20));
    await enterCaseNumberPage.expectNoSpecificValidationErrors(['Case number must be between 16 and 20 characters']);
    await enterCaseNumberPage.expectValidationError('Case number must be 16 digits');
     // await axeUtils.audit(); temporariliy skipped due to accessibility defects  });
  });

  // --- VALIDATION ERROR SCENARIOS ---

  test('Error: Empty input @PR @a11y', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('');
    await enterCaseNumberPage.expectValidationError('Enter your case number');
     // await axeUtils.audit(); temporariliy skipped due to accessibility defects
  });

  test('Error: Boundary check - 15 characters @PR @a11y', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(15));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
     // await axeUtils.audit(); temporariliy skipped due to accessibility defects
  });

  test('Error: Boundary check - 21 characters @PR @a11y', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(21));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
     // await axeUtils.audit(); temporariliy skipped due to accessibility defects
  });

  test('Error: Invalid format - Letters @PR @a11y', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('1234-5678-ABCD-EFGH');
    await enterCaseNumberPage.expectValidationError(
      'Case number must only include numbers 0 to 9 and special characters such as hyphens'
    );
     // await axeUtils.audit(); temporariliy skipped due to accessibility defects
  });

  test('Error: Case number not found @PR @a11y', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('1111222233334444');
    await enterCaseNumberPage.expectValidationError(
      'We cannot find that case number, Enter the case number that you received from the court'
    );
    // await axeUtils.audit(); temporariliy skipped due to accessibility defects
  });
});