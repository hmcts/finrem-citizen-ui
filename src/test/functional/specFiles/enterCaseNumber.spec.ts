import { expect, test } from '../../fixtures/fixtures';

const dataFactory = {
  generateDigits: (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join(''),
  validFormatted: () => {
    const d = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}-${d.slice(12, 16)}`;
  },
};

test.describe('Enter Case Number Page Verification', () => {
  test.beforeEach(async ({ loggedInPage: _loggedInPage, enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
  });

  // --- SUCCESS CASES (Logic Validation Passed) ---
  const successScenarios = [
    { desc: '16 digits', value: dataFactory.generateDigits(16) },
    { desc: '16 digits with hyphens', value: dataFactory.validFormatted() },
    { desc: '16 digits with spaces', value: `  ${dataFactory.generateDigits(16)}  ` },
  ];

  for (const { desc, value } of successScenarios) {
    test(`Success: ${desc} @PR`, async ({ enterCaseNumberPage }) => {
      await enterCaseNumberPage.submitCaseNumber(value);

      /**
       * Since we use random data, the backend may return "Case number not found".
       * To verify the VALIDATION logic passed, we check that the specific length/format error messages are NOT visible.
       */
      const validationErrors = [
        'Case number must be between 16 and 20 characters',
        'Case number must only include numbers 0 to 9 and special characters such as hyphens',
        'Case number must be 16 digits',
      ];

      for (const error of validationErrors) {
        await expect(enterCaseNumberPage.errorSummary.getByRole('link', { name: error })).not.toBeVisible();
      }
    });
  }

  // --- END-TO-END HAPPY PATH ---
  test('Happy Path: User enters valid existing case number and proceeds to the service dashboard @PR', async ({
    enterCaseNumberPage,
    page,
  }) => {
    const VALID_EXISTING_CASE = '1773677683810798';
    const PAGE_TITLE = 'Dividing your money and property';

    await enterCaseNumberPage.submitCaseNumber(VALID_EXISTING_CASE);
    await expect(enterCaseNumberPage.errorSummary).toBeHidden({ timeout: 15000 });

    // Verify landing on the next page by checking the Service Name in the navigation
    const serviceNameLink = page.getByRole('link', { name: PAGE_TITLE });
    await expect(serviceNameLink).toBeVisible();
    await expect(page.locator('body')).toContainText('This is a placeholder page for the access code step');
  });

  // --- FAILURE CASES (Based on Backend Logic) ---
  test('Error: Empty input @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('');
    await enterCaseNumberPage.expectValidationError('Enter your case number');
  });

  test('Error: Too short (15 digits) @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(15));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
  });

  test('Error: Invalid format (Letters) @PR', async ({ enterCaseNumberPage }) => {
    const invalid = dataFactory.generateDigits(12) + 'ABCD';
    await enterCaseNumberPage.submitCaseNumber(invalid);
    await enterCaseNumberPage.expectValidationError(
      'Case number must only include numbers 0 to 9 and special characters such as hyphens'
    );
  });

  test('Error: Digit count (20 digits) @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(20));
    await enterCaseNumberPage.expectValidationError('Case number must be 16 digits');
  });

  test('Error: Invalid characters (Spaces) @PR', async ({ enterCaseNumberPage }) => {
    const val = '1234 5678 1234 5678';
    await enterCaseNumberPage.submitCaseNumber(val);
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
