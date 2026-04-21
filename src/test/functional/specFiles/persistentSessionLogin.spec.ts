import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';

test.describe('Persistent Session After Re-login', () => {
  /**
   * Verify that after logging in, entering case number and access code,
   * signing out, and navigating back to the dashboard, the user lands directly
   * on the dashboard without re-entering case number or access code.
   * IDAM SSO re-authenticates and the linked case session is restored.
   */
  test.skip('User lands on dashboard after re-login without re-entering case details @PR @a11y', async ({
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

    // Sign out — IDAM redirects to its sign-in page
    await basePage.signOut();
    await expect(page).toHaveURL(/.*sign-in-or-create.*/);

    // Navigate back to the app — IDAM SSO re-authenticates the user
    await page.goto('/dashboard');

    // Verify user lands directly on dashboard, no case number or access code required
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  /**
   * Verify that case session persists across multiple tabs/contexts
   * within the same authenticated session
   */
  test('Case session persists across multiple tabs in same browser context @PR @a11y', async ({
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
   */
  test('Case session persists when navigating away and back to dashboard @PR @a11y', async ({
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
