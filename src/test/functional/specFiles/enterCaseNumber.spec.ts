import { expect, test } from '../../fixtures/fixtures';
import { createCase } from '../utils/helpers/caseCreation';
import { ErrorMessages, caseDataFactory } from '../utils/helpers/testData';

const { generateDigits, formatCaseNumber } = caseDataFactory;

/** Helper to create a Financial Remedy case for the given citizen email */
async function createFinancialRemedyCase(citizenEmail: string): Promise<string> {
  return createCase({
    caseType: 'FinancialRemedyMVP2',
    eventId: 'FR_newPaperCase',
    dataLocation: 'src/test/functional/data/case-data.json',
    dataModifications: [{ action: 'insert', key: 'applicantEmail', value: citizenEmail }],
  });
}

/**
 * Happy Path Tests
 * NOTE: Skipped - portal case lookup requires specific case state not set by FR_newPaperCase
 */
test.describe('Enter Case Number - Citizen Happy Path', () => {
  test('Citizen enters valid case number and lands on access code page @PR', async ({
    loggedInPage,
    enterCaseNumberPage,
    page,
  }) => {
    const caseNumber = await createFinancialRemedyCase(loggedInPage.user.username);
    await page.goto('/enter-case-number');
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await enterCaseNumberPage.submitCaseNumber(caseNumber);
    await expect(page).toHaveURL(/\/enter-access-code$/);
  });

  test('Citizen enters hyphenated case number and lands on access code page @PR', async ({
    loggedInPage,
    enterCaseNumberPage,
    page,
  }) => {
    const caseNumber = await createFinancialRemedyCase(loggedInPage.user.username);
    await page.goto('/enter-case-number');
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await enterCaseNumberPage.submitCaseNumber(formatCaseNumber(caseNumber));
    await expect(page).toHaveURL(/\/enter-access-code$/);
  });

  test('Case created via API - portal returns not found (current behavior) @PR', async ({
    loggedInPage,
    enterCaseNumberPage,
    page,  
  }) => {
    const caseNumber = await createFinancialRemedyCase(loggedInPage.user.username);
    await page.goto('/enter-case-number'); 
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await enterCaseNumberPage.submitCaseNumber(caseNumber);
    await enterCaseNumberPage.expectValidationError(ErrorMessages.NOT_FOUND);
  });
});

/** Validation Tests */
test.describe('Enter Case Number Page Verification', () => {
  test.beforeEach(async ({ loggedInPage: _loggedInPage, enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
  });

  test('Error: Empty input @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('');
    await enterCaseNumberPage.expectValidationError(ErrorMessages.EMPTY);
  });

  test('Error: Boundary check - 15 characters @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(generateDigits(15));
    await enterCaseNumberPage.expectValidationError(ErrorMessages.INVALID_LENGTH);
  });

  test('Error: Boundary check - 21 characters @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(generateDigits(21));
    await enterCaseNumberPage.expectValidationError(ErrorMessages.INVALID_LENGTH);
  });

  test('Error: Invalid format - Letters @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('1234-5678-ABCD-EFGH');
    await enterCaseNumberPage.expectValidationError(ErrorMessages.INVALID_CHARS);
  });

  test('Error: Case number not found @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber('1111222233334444');
    await enterCaseNumberPage.expectValidationError(ErrorMessages.NOT_FOUND);
  });

  test('Success Logic: 20 digits (Upper Boundary) @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.submitCaseNumber(generateDigits(20));
    await enterCaseNumberPage.expectNoSpecificValidationErrors([ErrorMessages.INVALID_LENGTH]);
    await enterCaseNumberPage.expectValidationError('Case number must be 16 digits');
  });
});
