import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';

test.describe('Enter Access Code - Page Content', () => {
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

test.describe('Enter Access Code - Validation Errors', () => {
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
test.describe('Enter Access Code - Happy Path', () => {
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
   * TODO: RESOLVE - Currently skipped due to implementation of invalidating access code (PR #347).
   * The mock test framework does not properly mock the CCD triggerEvent() call required for access code invalidation.
   * When a valid access code is submitted, the system now calls invalidateAccessCode() which triggers a CCD event.
   * This test requires either:
   * 1. Mock support for CCD API triggerEvent() in the test framework, or
   * 2. Bypass access code invalidation in mock test mode via MOCK_INVALIDATE_ACCESS_CODE=false flag
   */
  test.skip('[mock] Citizen can enter valid applicant access code and view case summary', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    assertionHelpers: _assertionHelpers,
  }) => {
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Verify whitespace is trimmed from access code
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   * 
   * TODO: RESOLVE - Currently skipped due to implementation of invalidating access code (PR #347).
   * The mock test framework does not properly mock the CCD triggerEvent() call required for access code invalidation.
   * When a valid access code is submitted, the system now calls invalidateAccessCode() which triggers a CCD event.
   * This test requires either:
   * 1. Mock support for CCD API triggerEvent() in the test framework, or
   * 2. Bypass access code invalidation in mock test mode via MOCK_INVALIDATE_ACCESS_CODE=false flag
   */
  test.skip('[mock] Success: Access code with leading/trailing whitespace is accepted', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await enterAccessCodePage.submitAccessCode(`  ${accessCode}  `);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Citizen successfully enters valid respondent access code and views case
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   * 
   * TODO: RESOLVE - Currently skipped due to implementation of invalidating access code (PR #347).
   * The mock test framework does not properly mock the CCD triggerEvent() call required for access code invalidation.
   * When a valid access code is submitted, the system now calls invalidateAccessCode() which triggers a CCD event.
   * This test requires either:
   * 1. Mock support for CCD API triggerEvent() in the test framework, or
   * 2. Bypass access code invalidation in mock test mode via MOCK_INVALIDATE_ACCESS_CODE=false flag
   */
  test.skip('[mock] Citizen can enter valid respondent access code and view case summary', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    const accessCode = contestedCaseWithHearing.respondentAccessCode;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Access codes are case-insensitive
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   * 
   * TODO: RESOLVE - Currently skipped due to implementation of invalidating access code (PR #347).
   * The mock test framework does not properly mock the CCD triggerEvent() call required for access code invalidation.
   * When a valid access code is submitted, the system now calls invalidateAccessCode() which triggers a CCD event.
   * This test requires either:
   * 1. Mock support for CCD API triggerEvent() in the test framework, or
   * 2. Bypass access code invalidation in mock test mode via MOCK_INVALIDATE_ACCESS_CODE=false flag
   */
  test.skip('[mock] Access code submission is case-insensitive', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    // Enter access code in lowercase
    const lowercaseCode = accessCode.toLowerCase();

    await enterAccessCodePage.submitAccessCode(lowercaseCode);

    await dashboardPage.verifyDashboardPageContent();
  });
});