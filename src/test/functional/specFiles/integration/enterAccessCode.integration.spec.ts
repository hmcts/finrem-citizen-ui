import { expect, test } from '../../../fixtures/fixtures';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';

/**
 * INTEGRATION TESTS: Enter Access Code
 * 
 * These tests use the real CCD path only:
 * case number submission -> access code submission -> dashboard.
 * They call invalidateAccessCode() which triggers real CCD events.
 * They require a real contested case created via API with valid access codes.
 * 
 * Runs on: Environments with reachable real CCD dependencies when ACCESS_CODE_REAL_INTEGRATION=true
 * Requires: Real CCD instance reachable, valid case with real access codes
 * Default: Skipped for now until real-flow implementation is fully enabled
 */

// INTEGRATION: Happy-path submission calls invalidateAccessCode(), which triggers
// a CCD event. These tests require a real case + real access-code integration.
test.describe('[integration-happy-path] Enter Access Code - Happy Path', () => {
  const runAccessCodeIntegration = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';
  const realCcdFlowImplemented = false;

  test.skip(
    !runAccessCodeIntegration || !realCcdFlowImplemented,
    'Skipped for now: real CCD enter-access-code flow is not fully implemented yet. Enable when implementation is complete and ACCESS_CODE_REAL_INTEGRATION=true.'
  );

  test.beforeEach(async ({
    loggedInPage,
    basePage,
    contestedCaseWithHearing,
  }) => {
    expectAuthenticated(loggedInPage);
    await basePage.injectCaseSession(
      contestedCaseWithHearing.caseId,
      contestedCaseWithHearing.applicantAccessCode,
      contestedCaseWithHearing.respondentAccessCode
    );
    await basePage.verifyGlobalHeaderAndFooter();
  });

  /**
   * Citizen successfully enters valid applicant access code and views case.
  * [integration-happy-path] Requires real CCD-backed invalidation flow.
   */
  test('[integration-happy-path] Citizen can enter valid applicant access code and view case summary @a11y', async ({
    loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
    await runA11yAudit(axeUtils);
  });

  /**
   * Verify whitespace is trimmed from access code.
  * [integration-happy-path] Requires real CCD-backed invalidation flow.
   */
  test('[integration-happy-path] Success: Access code with leading/trailing whitespace is accepted @a11y', async ({
    loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    await enterAccessCodePage.submitAccessCode(`  ${accessCode}  `);
    await dashboardPage.verifyDashboardPageContent();
    await runA11yAudit(axeUtils);
  });

  /**
   * Citizen successfully enters valid respondent access code and views case.
  * [integration-happy-path] Requires real CCD-backed invalidation flow.
   */
  test('[integration-happy-path] Citizen can enter valid respondent access code and view case summary @a11y', async ({
    loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);
    const accessCode = contestedCaseWithHearing.respondentAccessCode;

    await enterAccessCodePage.submitAccessCode(accessCode);
    await dashboardPage.verifyDashboardPageContent();
    await runA11yAudit(axeUtils);
  });

  /**
   * Access codes are case-insensitive.
  * [integration-happy-path] Requires real CCD-backed invalidation flow.
   */
  test('[integration-happy-path] Access code submission is case-insensitive @a11y', async ({
    loggedInPage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);
    const accessCode = contestedCaseWithHearing.applicantAccessCode;

    // Enter access code in lowercase
    const lowercaseCode = accessCode.toLowerCase();

    await enterAccessCodePage.submitAccessCode(lowercaseCode);

    await dashboardPage.verifyDashboardPageContent();
    await runA11yAudit(axeUtils);
  });
});

test.describe('[integration-happy-path] Enter Access Code - Full Journey', () => {
  const runIntegration = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';
  const realCcdFlowImplemented = false;

  test.skip(
    !runIntegration || !realCcdFlowImplemented,
    'Skipped for now: real CCD enter-access-code flow is not fully implemented yet. Enable when implementation is complete and ACCESS_CODE_REAL_INTEGRATION=true.'
  );

  test('[integration-happy-path] Citizen can submit applicant access code without pre-injection @integration @a11y', async ({
    loggedInPage,
    enterCaseNumberPage,
    contestedCaseWithHearing,
    enterAccessCodePage,
    dashboardPage,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
    await expect(enterAccessCodePage.page).toHaveURL(/\/enter-access-code$/);

    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();
    await runA11yAudit(axeUtils);
  });
});
