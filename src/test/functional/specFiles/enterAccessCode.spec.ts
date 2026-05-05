import { DEFAULT_AXE_OPTIONS, test } from '../../fixtures/fixtures';

const MOCK_CASE_NUMBER = process.env.MOCK_CASE_NUMBER || '2222333344445555';
const MOCK_APPLICANT_CODE = 'APPCODE1';
const MOCK_RESPONDENT_CODE = 'RSPCODE1';

/**
 * MOCK COVERAGE (RUNNING)
 *
 * This section runs only against test-support mocked session injection and is
 * expected to pass without any live CCD dependency.
 */
test.describe('Enter Access Code - Page Content [MOCK]', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    basePage,
  }) => {
    await basePage.injectCaseSession(
      MOCK_CASE_NUMBER,
      MOCK_APPLICANT_CODE,
      MOCK_RESPONDENT_CODE
    );
    await basePage.verifyGlobalHeaderAndFooter();
  });

  // Verify that the Enter Access Code page displays all expected elements.
  test('[MOCK] Access code page contains all required elements @a11y', async ({
    enterAccessCodePage,
    assertionHelpers: _assertionHelpers,
    axeUtils,
  }) => {
    await enterAccessCodePage.verifyAccessCodePageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});

/**
 * MOCK COVERAGE (RUNNING)
 *
 * Validation scenarios intentionally run using mocked case/session data.
 */
test.describe('Enter Access Code - Validation Errors [MOCK]', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    basePage,
  }) => {
    await basePage.injectCaseSession(
      MOCK_CASE_NUMBER,
      MOCK_APPLICANT_CODE,
      MOCK_RESPONDENT_CODE
    );
    await basePage.verifyGlobalHeaderAndFooter();
  });

  /**
   * Verify empty access code input validation
   */
  test('[MOCK] Error: Access code is empty', async ({
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
  test('[MOCK] Error: Access code is too short', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC123');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
  });

  /**
   * Verify access code length validation (too long)
   */
  test('[MOCK] Error: Access code is too long', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABCDEF1234');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
  });

  /**
   * Verify access code format validation (special characters not allowed)
   */
  test('[MOCK] Error: Access code contains invalid characters', async ({
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
  test('[MOCK] Error: Access code contains spaces', async ({
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
  test('[MOCK] Error: Access code not found in case', async ({
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

/**
 * MOCK HAPPY PATHS (RUNNING)
 *
 * These tests run entirely against test-support mocked session + mock CCD routes.
 */
test.describe('Enter Access Code - Happy Path [MOCK]', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    basePage,
  }) => {
    await basePage.injectCaseSession(
      MOCK_CASE_NUMBER,
      MOCK_APPLICANT_CODE,
      MOCK_RESPONDENT_CODE
    );
    await basePage.verifyGlobalHeaderAndFooter();
  });

  /**
   * Citizen successfully enters valid applicant access code and views case.
   */
  test('[MOCK] Citizen can enter valid applicant access code and view case summary', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    assertionHelpers: _assertionHelpers,
  }) => {
    const accessCode = MOCK_APPLICANT_CODE;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Verify whitespace is trimmed from access code.
   */
  test('[MOCK] Success: Access code with leading/trailing whitespace is accepted', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
  }) => {
    const accessCode = MOCK_APPLICANT_CODE;

    await enterAccessCodePage.submitAccessCode(`  ${accessCode}  `);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Citizen successfully enters valid respondent access code and views case.
   */
  test('[MOCK] Citizen can enter valid respondent access code and view case summary', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
  }) => {
    const accessCode = MOCK_RESPONDENT_CODE;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Access codes are case-insensitive.
   */
  test('[MOCK] Access code submission is case-insensitive', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
  }) => {
    const accessCode = MOCK_APPLICANT_CODE;

    // Enter access code in lowercase
    const lowercaseCode = accessCode.toLowerCase();

    await enterAccessCodePage.submitAccessCode(lowercaseCode);

    await dashboardPage.verifyDashboardPageContent();
  });
});