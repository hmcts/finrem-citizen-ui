import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';
import { BasePage } from '../pom/basePage.page';
import { DashboardPage } from '../pom/dashboardPage.page';
import { EnterAccessCodePage } from '../pom/enterAccessCode.page';

interface CaseWithHearing {
  caseId: string;
  applicantAccessCode: string;
  respondentAccessCode: string;
}

async function navigateToLinkedDashboard(
  basePage: BasePage,
  enterAccessCodePage: EnterAccessCodePage,
  dashboardPage: DashboardPage,
  contestedCaseWithHearing: CaseWithHearing
): Promise<void> {
  await basePage.injectCaseSession(
    contestedCaseWithHearing.caseId,
    contestedCaseWithHearing.applicantAccessCode,
    contestedCaseWithHearing.respondentAccessCode
  );
  await basePage.verifyGlobalHeaderAndFooter();
  await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
  await dashboardPage.verifyDashboardPageContent();
}

// Persistent session tests remain skipped until Form C-generated access codes are
// available end to end. These tests depend on navigateToLinkedDashboard() which requires
// a valid access-code submission flow.
test.describe('Persistent Session After Re-login', () => {
  test.use({ useMockTestSupport: true });

  /**
   * Verify that after logging in, entering case number and access code,
   * signing out, and navigating back to the dashboard, the user lands directly
   * on the dashboard without re-entering case number or access code.
   * IDAM SSO re-authenticates and the linked case session is restored.
   * Kept skipped until Form C-generated access codes are available end to end.
   */
  test.skip('[mock] User lands on dashboard after re-login without re-entering case details @a11y', async ({
    loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    idamPage,
    page,
    axeUtils,
  }) => {
    // Two full login cycles: loggedInPage fixture + explicit re-login after sign-out.
    // Longer timeout required for login flow
    test.setTimeout(90_000);
    await navigateToLinkedDashboard(basePage, enterAccessCodePage, dashboardPage, contestedCaseWithHearing);

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
   * Kept skipped until Form C-generated access codes are available end to end.
   */
  test.skip('[mock] Case session persists across multiple tabs in same browser context @a11y', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    context,
    axeUtils,
  }) => {
    await navigateToLinkedDashboard(basePage, enterAccessCodePage, dashboardPage, contestedCaseWithHearing);

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
   * Kept skipped until Form C-generated access codes are available end to end.
   */
  test.skip('[mock] Case session persists when navigating away and back to dashboard @a11y', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    page,
    axeUtils,
  }) => {
    await navigateToLinkedDashboard(basePage, enterAccessCodePage, dashboardPage, contestedCaseWithHearing);

    // Navigate away then back to dashboard within the same authenticated session
    await page.goto('/');
    await page.goto('/dashboard');

    // Verify user lands back on dashboard without re-entering case/access code
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});
