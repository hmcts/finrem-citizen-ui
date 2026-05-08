import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';

const runRealIntegrationAccessCodeTests = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';

test.describe('[real-integration] Enter Access Code - Page Content', () => {
  test.skip(
    !runRealIntegrationAccessCodeTests,
    '[real-integration] skipped by default; run with ACCESS_CODE_REAL_INTEGRATION=true when environment is stable'
  );

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    contestedCaseForCaseNumber,
    page,
    basePage,
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await basePage.verifyGlobalHeaderAndFooter();
  });

  // Verify that the Enter Access Code page displays all expected elements.
  test('Access code page contains all required elements @a11y', async ({
    enterAccessCodePage,
    assertionHelpers: _assertionHelpers,
    axeUtils,
  }) => {
    await enterAccessCodePage.verifyAccessCodePageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});

test.describe('[real-integration] Enter Access Code - Validation Errors', () => {
  test.skip(
    !runRealIntegrationAccessCodeTests,
    '[real-integration] skipped by default; run with ACCESS_CODE_REAL_INTEGRATION=true when environment is stable'
  );

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    contestedCaseForCaseNumber,
    page,
    basePage,
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseForCaseNumber.caseId);
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await basePage.verifyGlobalHeaderAndFooter();
  });

  /**
   * Verify empty access code input validation
   */
  test('Error: Access code is empty', async ({
    enterAccessCodePage,
    assertionHelpers: _assertionHelpers,
    page: _page,
  }) => {
    // Submit without entering access code
    await enterAccessCodePage.continueBtn.click();

    await enterAccessCodePage.expectValidationError('Enter your access code');
  });

  /**
   * Verify access code length validation (too short)
   */
  test('Error: Access code is too short', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC123');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
  });

  /**
   * Verify access code length validation (too long)
   */
  test('Error: Access code is too long', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABCDEF1234');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
  });

  /**
   * Verify access code format validation (special characters not allowed)
   */
  test('Error: Access code contains invalid characters', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC-1234');

    await enterAccessCodePage.expectValidationError(
      'Access code must only include letters a-z, and numbers 0-9'
    );
  });

  /**
   * Verify access code format validation (spaces not allowed)
   */
  test('Error: Access code contains spaces', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC 1234');

    await enterAccessCodePage.expectValidationError(
      'Access code must only include letters a-z, and numbers 0-9'
    );
  });

  /**
   * Verify invalid access code not found in system
   */
  test('Error: Access code not found in case', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
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
test.describe('[mock] Enter Access Code - Happy Path', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    basePage,
    contestedCaseWithHearing,
  }) => {
    await basePage.injectCaseSession(
      contestedCaseWithHearing.caseId,
      contestedCaseWithHearing.applicantAccessCode,
      contestedCaseWithHearing.respondentAccessCode
    );
    await basePage.verifyGlobalHeaderAndFooter();
  });

  /**
   * Citizen successfully enters valid applicant access code and views case
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   * 
  * This test depends on mock CCD endpoints for invalidate-access-code events.
  * It is auto-skipped when ACCESS_CODE_REAL_INTEGRATION=true.
   */
  test('[mock] Citizen can enter valid applicant access code and view case summary', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    assertionHelpers: _assertionHelpers,
  }) => {
    test.skip(
      runRealIntegrationAccessCodeTests,
      '[mock] disabled because ACCESS_CODE_REAL_INTEGRATION=true requests real CCD access-code flow'
    );

    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Verify whitespace is trimmed from access code
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   * 
  * This test depends on mock CCD endpoints for invalidate-access-code events.
  * It is auto-skipped when ACCESS_CODE_REAL_INTEGRATION=true.
   */
  test('[mock] Success: Access code with leading/trailing whitespace is accepted', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    test.skip(
      runRealIntegrationAccessCodeTests,
      '[mock] disabled because ACCESS_CODE_REAL_INTEGRATION=true requests real CCD access-code flow'
    );

    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await enterAccessCodePage.submitAccessCode(`  ${accessCode}  `);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Citizen successfully enters valid respondent access code and views case
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   * 
  * This test depends on mock CCD endpoints for invalidate-access-code events.
  * It is auto-skipped when ACCESS_CODE_REAL_INTEGRATION=true.
   */
  test('[mock] Citizen can enter valid respondent access code and view case summary', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    test.skip(
      runRealIntegrationAccessCodeTests,
      '[mock] disabled because ACCESS_CODE_REAL_INTEGRATION=true requests real CCD access-code flow'
    );

    const accessCode = contestedCaseWithHearing.respondentAccessCode;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Access codes are case-insensitive
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   * 
  * This test depends on mock CCD endpoints for invalidate-access-code events.
  * It is auto-skipped when ACCESS_CODE_REAL_INTEGRATION=true.
   */
  test('[mock] Access code submission is case-insensitive', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    test.skip(
      runRealIntegrationAccessCodeTests,
      '[mock] disabled because ACCESS_CODE_REAL_INTEGRATION=true requests real CCD access-code flow'
    );

    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    // Enter access code in lowercase
    const lowercaseCode = accessCode.toLowerCase();

    await enterAccessCodePage.submitAccessCode(lowercaseCode);

    await dashboardPage.verifyDashboardPageContent();
  });
});

test.describe('[real-integration] Enter Access Code - Happy Path', () => {
  test.skip(
    !runRealIntegrationAccessCodeTests,
    '[real-integration] skipped by default; run with ACCESS_CODE_REAL_INTEGRATION=true when environment is stable'
  );

  test('Citizen can submit real applicant access code @real-integration', async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    contestedCaseWithHearing,
    enterAccessCodePage,
    dashboardPage,
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
    await expect(enterAccessCodePage.page).toHaveURL(/\/enter-access-code$/);

    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();
  });
});