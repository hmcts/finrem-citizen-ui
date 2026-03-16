import { expect, test } from '../../fixtures/fixtures';

test.describe('Enter Case Number Page Verification', () => {
  test.beforeEach(async ({ loggedInPage: _loggedInPage, enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
  });

  // Test to verify entering a case number
  // Skipped as logic not yet implemented, but test structure in place for when it is.
  test.skip('User can enter a valid case number and proceed @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.enterValidCaseNumber('1234567890123456'); // Valid case number (16-20digits)
  });

  //Test to verify entering an invalid case number and not proceeding
  // Skipped as logic not yet implemented, but test structure in place for when it is.
  test.skip('User cannot proceed with an invalid case number @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.enterInvalidCaseNumber('1234'); // Invalid case number (too short)
    // Verify that we are still on the same page
    await expect(enterCaseNumberPage.caseNumberInput).toBeVisible();
  });
});
