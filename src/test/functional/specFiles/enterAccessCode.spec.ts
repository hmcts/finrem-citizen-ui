import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';

// MOCK-ONLY: This describe uses /__test/inject-case-session with static values.
// It does not create CCD cases or call external case-creation APIs.
test.describe('Enter Access Code - Page Content', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    page,
    basePage,
  }) => {
    await basePage.injectCaseSession('1234567890123456', 'APPCODE1', 'RSPCODE1');
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await basePage.verifyGlobalHeaderAndFooter();
  });

  // MOCK-ONLY: Verifies static page content using injected session data.
  test('[mock] Access code page contains all required elements @a11y', async ({
    enterAccessCodePage,
    assertionHelpers: _assertionHelpers,
    axeUtils,
  }) => {
    await enterAccessCodePage.verifyAccessCodePageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});

// MOCK-ONLY: Validation tests run against injected mock session data.
// They are isolated from live CCD/network dependencies.
test.describe('Enter Access Code - Validation Errors', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    page,
    basePage,
  }) => {
    await basePage.injectCaseSession('1234567890123456', 'APPCODE1', 'RSPCODE1');
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await basePage.verifyGlobalHeaderAndFooter();
  });

  /**
   * MOCK-ONLY: Verify empty access code input validation.
   */
  test('[mock] Error: Access code is empty', async ({
    enterAccessCodePage,
    assertionHelpers: _assertionHelpers,
    page: _page,
  }) => {
    // Submit without entering access code
    await enterAccessCodePage.continueBtn.click();

    await enterAccessCodePage.expectValidationError('Enter your access code');
  });

  /**
   * MOCK-ONLY: Verify access code length validation (too short).
   */
  test('[mock] Error: Access code is too short', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC123');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
  });

  /**
   * MOCK-ONLY: Verify access code length validation (too long).
   */
  test('[mock] Error: Access code is too long', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABCDEF1234');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
  });

  /**
   * MOCK-ONLY: Verify access code format validation (special characters not allowed).
   */
  test('[mock] Error: Access code contains invalid characters', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC-1234');

    await enterAccessCodePage.expectValidationError(
      'Access code must only include letters a-z, and numbers 0-9'
    );
  });

  /**
   * MOCK-ONLY: Verify access code format validation (spaces not allowed).
   */
  test('[mock] Error: Access code contains spaces', async ({
    enterAccessCodePage,
    page: _page,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC 1234');

    await enterAccessCodePage.expectValidationError(
      'Access code must only include letters a-z, and numbers 0-9'
    );
  });

  /**
   * MOCK-ONLY: Verify invalid access code not found in injected case data.
   */
  test('[mock] Error: Access code not found in case', async ({
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

// INTEGRATION: Happy-path submission calls invalidateAccessCode(), which triggers
// a CCD event. These tests require a real case + real access-code integration.
test.describe('Enter Access Code - Happy Path', () => {
  const runAccessCodeIntegration = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';

  test.skip(
    !runAccessCodeIntegration,
    'Integration disabled by default. Set ACCESS_CODE_REAL_INTEGRATION=true for CCD-backed happy-path tests.'
  );

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
   * Citizen successfully enters valid applicant access code and views case.
   * [integration] Requires real CCD-backed invalidation flow.
   */
  test('[integration] Citizen can enter valid applicant access code and view case summary', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    assertionHelpers: _assertionHelpers,
  }) => {
    test.skip(
      !runAccessCodeIntegration,
      '[mock] disabled because ACCESS_CODE_REAL_INTEGRATION=false'
    );

    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Verify whitespace is trimmed from access code.
   * [integration] Requires real CCD-backed invalidation flow.
   */
  test('[integration] Success: Access code with leading/trailing whitespace is accepted', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    test.skip(
      !runAccessCodeIntegration,
      '[mock] disabled because ACCESS_CODE_REAL_INTEGRATION=false'
    );

    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await enterAccessCodePage.submitAccessCode(`  ${accessCode}  `);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Citizen successfully enters valid respondent access code and views case.
   * [integration] Requires real CCD-backed invalidation flow.
   */
  test('[integration] Citizen can enter valid respondent access code and view case summary', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    test.skip(
      !runAccessCodeIntegration,
      '[mock] disabled because ACCESS_CODE_REAL_INTEGRATION=false'
    );

    const accessCode = contestedCaseWithHearing.respondentAccessCode;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
  });

  /**
   * Access codes are case-insensitive.
   * [integration] Requires real CCD-backed invalidation flow.
   */
  test('[integration] Access code submission is case-insensitive', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    test.skip(
      !runAccessCodeIntegration,
      '[mock] disabled because ACCESS_CODE_REAL_INTEGRATION=false'
    );

    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    // Enter access code in lowercase
    const lowercaseCode = accessCode.toLowerCase();

    await enterAccessCodePage.submitAccessCode(lowercaseCode);

    await dashboardPage.verifyDashboardPageContent();
  });
});

test.describe('[real-integration] Enter Access Code - Happy Path', () => {
  const runRealIntegrationAccessCodeTests = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';

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