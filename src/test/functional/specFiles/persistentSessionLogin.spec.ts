import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';

const isLocalRun = !process.env.CI;
const isAatTarget =
  process.env.RUNNING_ENV === 'aat' ||
  process.env.TEST_URL?.includes('.aat.platform.hmcts.net') === true;

// MOCK: All tests in this describe use the contestedCaseWithHearing fixture with hardcoded
// access codes (APPCODE1 / RSPCODE1) injected via /__test/inject-case-session.
// No Form C or FR_manageHearings hearing flow is required.
// To run against real CCD-generated codes: ACCESS_CODE_REAL_INTEGRATION=true
test.describe('Persistent Session After Re-login', () => {
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
   * Verify that after logging in, entering case number and access code,
   * signing out, and navigating back to the dashboard, the user lands directly
   * on the dashboard without re-entering case number or access code.
   * IDAM SSO re-authenticates and the linked case session is restored.
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   */
  test('[mock] User lands on dashboard after re-login without re-entering case details @PR @a11y', async ({
    loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    idamPage,
    page,
    axeUtils,
  }) => {
    // Inject mock session and link case
    await basePage.injectCaseSession(
      contestedCaseWithHearing.caseId,
      contestedCaseWithHearing.applicantAccessCode,
      contestedCaseWithHearing.respondentAccessCode
    );
    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();

    // Sign out — IDAM redirects to its sign-in page
    await basePage.signOut();
    await expect(page).toHaveURL(/.*sign-in-or-create.*/);

    // Re-authenticate via IDAM — explicit sign-out requires explicit re-login (no silent SSO)
    await idamPage.login(loggedInPage.user);

    // Navigate to dashboard — linked case session should be restored without re-entering case details
    await page.goto('/dashboard');

    // Verify user lands directly on dashboard, no case number or access code required
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  /**
   * Verify that case session persists across multiple tabs/contexts
   * within the same authenticated session.
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   */
  test('[mock] Case session persists across multiple tabs in same browser context @PR @a11y', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    context,
    axeUtils,
  }) => {
    // Inject mock session and link case in first tab
    await basePage.injectCaseSession(
      contestedCaseWithHearing.caseId,
      contestedCaseWithHearing.applicantAccessCode,
      contestedCaseWithHearing.respondentAccessCode
    );
    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();

    // Open a new tab in the same browser context (shares cookies/session)
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');

    // Verify the new tab lands on dashboard without re-entering case/access code
    await expect(newPage).toHaveURL(/\/dashboard$/);

    // Audit the stable dashboard state in the original tab.
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);

    await newPage.close();
  });

  /**
   * Verify that after entering an access code, navigating away and back to the
   * dashboard within the same session does not require re-entering case/access code.
   * (page.reload() is not used because a hard reload clears in-memory mock session state)
   * [mock] Uses hardcoded access codes injected via test session endpoint.
   */
  test('[mock] Case session persists when navigating away and back to dashboard @PR @a11y', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    page,
    axeUtils,
  }) => {
    // Inject mock session and link case
    await basePage.injectCaseSession(
      contestedCaseWithHearing.caseId,
      contestedCaseWithHearing.applicantAccessCode,
      contestedCaseWithHearing.respondentAccessCode
    );
    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();

    // Navigate away then back to dashboard within the same authenticated session
    await page.goto('/');
    await page.goto('/dashboard');

    // Verify user lands back on dashboard without re-entering case/access code
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});
