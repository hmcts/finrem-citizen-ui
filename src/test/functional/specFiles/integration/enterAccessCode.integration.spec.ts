import { expect, test } from '../../../fixtures/fixtures';

/**
 * INTEGRATION TESTS: Enter Access Code
 * 
 * These tests call invalidateAccessCode() which triggers real CCD events.
 * They require a real contested case created via API with valid access codes.
 * 
 * Runs on: All environments (local, preview, AAT) when ACCESS_CODE_REAL_INTEGRATION=true
 * Requires: Real CCD instance reachable, valid case with real access codes
 * Default: Skipped (set ACCESS_CODE_REAL_INTEGRATION=true to enable)
 */

// INTEGRATION: Happy-path submission calls invalidateAccessCode(), which triggers
// a CCD event. These tests require a real case + real access-code integration.
test.describe('[integration] Enter Access Code - Happy Path', () => {
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
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    // Enter access code in lowercase
    const lowercaseCode = accessCode.toLowerCase();

    await enterAccessCodePage.submitAccessCode(lowercaseCode);

    await dashboardPage.verifyDashboardPageContent();
  });
});

test.describe('[integration] Enter Access Code - Full Journey', () => {
  const runIntegration = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';

  test.skip(
    !runIntegration,
    'Integration disabled by default. Set ACCESS_CODE_REAL_INTEGRATION=true for end-to-end case entry and access code flow.'
  );

  test('[integration] Citizen can submit applicant access code without pre-injection @integration', async ({
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
