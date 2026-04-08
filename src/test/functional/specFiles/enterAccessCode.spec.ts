import { expect, test } from '../../fixtures/fixtures';

test.describe('Enter Access Code - Page Content', () => {
  // Verify that the Enter Access Code page displays all expected elements.
  test('Access code page contains all required elements @PR @a11y', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseForCaseNumber,
    page
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await enterAccessCodePage.verifyAccessCodePageContent();
    // TODO: Re-enable once axe `target-size` (WCAG 2.5.8) violation is resolved in GOV.UK Frontend components
    // await axeUtils.audit();
  });
});

test.describe('Enter Access Code - Validation Errors', () => {
  /**
   * Verify empty access code input validation
   */
  test('Error: Access code is empty @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseForCaseNumber,
    page
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);

    // Submit without entering access code
    await enterAccessCodePage.continueBtn.click();

    await enterAccessCodePage.expectValidationError('Enter your access code');
  });

  /**
   * Verify access code length validation (too short)
   */
  test('Error: Access code is too short @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseForCaseNumber,
    page
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);

    await enterAccessCodePage.submitAccessCode('ABC123');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
  });

  /**
   * Verify access code length validation (too long)
   */
  test('Error: Access code is too long @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseForCaseNumber,
    page
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);

    await enterAccessCodePage.submitAccessCode('ABCDEF1234');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
  });

  /**
   * Verify access code format validation (special characters not allowed)
   */
  test('Error: Access code contains invalid characters @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseForCaseNumber,
    page
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);

    await enterAccessCodePage.submitAccessCode('ABC-1234');

    await enterAccessCodePage.expectValidationError(
      'Access code must only include letters a-z, and numbers 0-9'
    );
  });

  /**
   * Verify access code format validation (spaces not allowed)
   */
  test('Error: Access code contains spaces @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseForCaseNumber,
    page
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);

    await enterAccessCodePage.submitAccessCode('ABC 1234');

    await enterAccessCodePage.expectValidationError(
      'Access code must only include letters a-z, and numbers 0-9'
    );
  });

  /**
   * Verify invalid access code not found in system
   */
  test('Error: Access code not found in case @PR', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseForCaseNumber,
    page
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);

    // Submit a valid format code that doesn't match any code on the case
    await enterAccessCodePage.submitAccessCode('XXXXXXXX');

    await enterAccessCodePage.expectValidationError(
      'We cannot find that access code, Enter the access code sent to you'
    );
  });

});

test.describe('Enter Access Code - Happy Path', () => {
  /**
   * Citizen successfully enters valid applicant access code and views case
   */
  test('Citizen can enter valid applicant access code and view case summary @PR', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await basePage.injectCaseSession(contestedCaseWithHearing.caseId, contestedCaseWithHearing.applicantAccessCode, contestedCaseWithHearing.respondentAccessCode);

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Verify whitespace is trimmed from access code
   */
  test('Success: Access code with leading/trailing whitespace is accepted @PR', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await basePage.injectCaseSession(contestedCaseWithHearing.caseId, contestedCaseWithHearing.applicantAccessCode, contestedCaseWithHearing.respondentAccessCode);

    await enterAccessCodePage.submitAccessCode(`  ${accessCode}  `);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Citizen successfully enters valid respondent access code and views case
   */
  test('Citizen can enter valid respondent access code and view case summary @PR', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    const accessCode = contestedCaseWithHearing.respondentAccessCode;

    await basePage.injectCaseSession(contestedCaseWithHearing.caseId, contestedCaseWithHearing.applicantAccessCode, contestedCaseWithHearing.respondentAccessCode);

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Access codes are case-insensitive
   */
  test('Access code submission is case-insensitive @PR', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await basePage.injectCaseSession(contestedCaseWithHearing.caseId, contestedCaseWithHearing.applicantAccessCode, contestedCaseWithHearing.respondentAccessCode);

    // Enter access code in lowercase
    const lowercaseCode = accessCode.toLowerCase();

    await enterAccessCodePage.submitAccessCode(lowercaseCode);

    await dashboardPage.verifyDashboardPageContent();
  });
});