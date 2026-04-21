import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';

const isLocalRun = !process.env.CI;
const isAatTarget =
  process.env.RUNNING_ENV === 'aat' ||
  process.env.TEST_URL?.includes('.aat.platform.hmcts.net') === true;

test.describe('Enter Access Code - Page Content', () => {
  // Verify that the Enter Access Code page displays all expected elements.
  test('Access code page contains all required elements @a11y', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseForCaseNumber,
    page,
    axeUtils,
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await enterAccessCodePage.verifyAccessCodePageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});

test.describe('Enter Access Code - Validation Errors', () => {
  /**
   * Verify empty access code input validation
   */
  test('Error: Access code is empty', async ({
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
  test('Error: Access code is too short', async ({
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
  test('Error: Access code is too long', async ({
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
  test('Error: Access code contains invalid characters', async ({
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
  test('Error: Access code contains spaces', async ({
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
  test('Error: Access code not found in case', async ({
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
      'Access code does not match case number'
    );
  });

});

// MOCK: The contestedCaseWithHearing fixture creates a real CCD case but uses hardcoded
// access codes (APPCODE1 / RSPCODE1) injected via /__test/inject-case-session.
// No Form C or FR_manageHearings hearing flow is required.
// To run against real CCD-generated codes: ACCESS_CODE_REAL_INTEGRATION=true
test.describe('Enter Access Code - Happy Path', () => {
  test.beforeEach(async ({ request }) => {
    if (isLocalRun && isAatTarget) {
      test.skip(true, '[mock] skipped for local runs targeting AAT');
    }

    const response = await request.get('/__test/inject-case-session');
    test.skip(
      response.status() === 404,
      '[mock] tests require /__test/inject-case-session (ENABLE_TEST_SUPPORT_ROUTES=true)'
    );
  });

  /**
   * Citizen successfully enters valid applicant access code and views case
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   */
  test('[mock] Citizen can enter valid applicant access code and view case summary', async ({
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
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   */
  test('[mock] Success: Access code with leading/trailing whitespace is accepted', async ({
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
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   */
  test('[mock] Citizen can enter valid respondent access code and view case summary', async ({
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
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   */
  test('[mock] Access code submission is case-insensitive', async ({
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