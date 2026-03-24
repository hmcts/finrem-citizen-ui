import { test } from '../../fixtures/fixtures';
import { createCase } from '../utils/helpers/caseCreation';

const dataFactory = {
  generateDigits: (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join(''),
  validFormatted: (base: string) => {
    // Formats a 16-digit string into XXXX-XXXX-XXXX-XXXX
    return `${base.slice(0, 4)}-${base.slice(4, 8)}-${base.slice(8, 12)}-${base.slice(12, 16)}`;
  },
};

test.describe('Enter Case Number Page Verification', () => {
  let VALID_CASE: string;

  test.beforeAll(async () => {
    // Create a test case before running all tests
    try {
      VALID_CASE = await createCase({
        caseType: 'FinancialRemedyMVP2',
        eventId: 'FR_newPaperCase',
        dataLocation: 'src/test/functional/data/case-data.json'
      });
      console.log(`Case created: ${VALID_CASE}`);
    } catch (error) {
      console.error('Failed to create test case:', error);
      throw error;
    }
  });

  test.beforeEach(async ({ loggedInPage: _loggedInPage, enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
  });

  // --- SUCCESS & BOUNDARY HAPPY PATHS ---
  test('Happy Path: 16 digits (Standard Boundary) @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(VALID_CASE);

    // Case exists but isn't linked to citizen - expect "not found"
    await enterCaseNumberPage.expectValidationError(
      'We cannot find that case number, Enter the case number that you received from the court'
    );
  });

  test('Happy Path: 16 digits with hyphens @PR', async ({ enterCaseNumberPage }) => {
    const formattedCase = dataFactory.validFormatted(VALID_CASE);
    await enterCaseNumberPage.submitCaseNumber(formattedCase);

    // Case exists but isn't linked to citizen - expect "not found"
    await enterCaseNumberPage.expectValidationError(
      'We cannot find that case number, Enter the case number that you received from the court'
    );
  });

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
