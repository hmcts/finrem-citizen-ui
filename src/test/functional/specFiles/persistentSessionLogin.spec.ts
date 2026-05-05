import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';
import { BasePage } from '../pom/basePage.page';
import { DashboardPage } from '../pom/dashboardPage.page';
import { EnterAccessCodePage } from '../pom/enterAccessCode.page';

const MOCK_CASE_NUMBER = process.env.MOCK_CASE_NUMBER || '2222333344445555';
const MOCK_APPLICANT_CODE = 'APPCODE1';
const MOCK_RESPONDENT_CODE = 'RSPCODE1';

async function navigateToLinkedDashboard(
  basePage: BasePage,
  enterAccessCodePage: EnterAccessCodePage,
  dashboardPage: DashboardPage
): Promise<void> {
  await basePage.injectCaseSession(
    MOCK_CASE_NUMBER,
    MOCK_APPLICANT_CODE,
    MOCK_RESPONDENT_CODE
  );
  await basePage.verifyGlobalHeaderAndFooter();
  await enterAccessCodePage.submitAccessCode(MOCK_APPLICANT_CODE);
  await dashboardPage.verifyDashboardPageContent();
}

// MOCK: All tests in this describe run against test-support mocked session and
// mock CCD endpoints (/__test/mock-ccd), with no live CCD dependency.
test.describe('Persistent Session After Re-login [MOCK]', () => {
  test.use({ useMockTestSupport: true });

  /**
   * Verify that after login + case link + sign-out + re-login,
   * the user lands on dashboard without re-entering case details.
   */
  test('[MOCK] User lands on dashboard after re-login without re-entering case details @a11y', async ({
    loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    idamPage,
    page,
    axeUtils,
  }) => {
    // Two full login cycles: loggedInPage fixture + explicit re-login after sign-out.
    // Longer timeout required for login flow
    test.setTimeout(90_000);
    await navigateToLinkedDashboard(basePage, enterAccessCodePage, dashboardPage);

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
   */
  test('[MOCK] Case session persists across multiple tabs in same browser context @a11y', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    context,
    axeUtils,
  }) => {
    await navigateToLinkedDashboard(basePage, enterAccessCodePage, dashboardPage);

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
  test('[MOCK] Case session persists when navigating away and back to dashboard @a11y', async ({
    loggedInPage: _loggedInPage,
    basePage,
    dashboardPage,
    enterAccessCodePage,
    page,
    axeUtils,
  }) => {
    await navigateToLinkedDashboard(basePage, enterAccessCodePage, dashboardPage);

    // Navigate away then back to dashboard within the same authenticated session
    await page.goto('/');
    await page.goto('/dashboard');

    // Verify user lands back on dashboard without re-entering case/access code
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});
