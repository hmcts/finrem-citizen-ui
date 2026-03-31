import { expect, test } from '../../fixtures/fixtures';

test.describe('Enter Access Code - Page Content', () => {
  /**
   * Verify that the Enter Access Code page displays all expected elements.
   */
  test('Access code page contains all required elements @PR @a11y', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    page
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await enterAccessCodePage.verifyAccessCodePageContent();
    //await axeUtils.audit();
  });

  // TODO: 
  // validation error scenarios 
  // - Empty input validation
  // - Invalid format validation (non-alphanumeric characters)
  // - Boundary checks (length validation - 8 characters required)
  // - Invalid access code (not found in system)
  //
  // happy path
  // - Successful submission with valid access code

  test('Citizen can enter a valid case number created via API @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    contestedCaseForCaseNumber,
    page
  }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);
  });
});

