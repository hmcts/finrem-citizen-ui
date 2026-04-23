import { expect,Locator, Page } from '@playwright/test';

const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
};

export class BasePage {
  readonly headerLogo: Locator;
  readonly footer: Locator;
  readonly licenceDescription: Locator;
  readonly licenceLink: Locator;
  readonly copyRightImgLink: Locator;
  readonly navigationLink: Locator;
  readonly serviceNav: Locator;
  readonly signOutBtn: Locator;

  constructor(readonly page: Page) {
    this.headerLogo = this.page.getByRole('img', { name: 'GOV.UK' });
    this.footer = this.page.locator('footer');
    this.licenceDescription = this.footer.getByText(/All content is available under the/i);
    this.licenceLink = this.footer.getByRole('link', { name: 'Open Government Licence' });
    this.copyRightImgLink = this.footer.getByRole('link', { name: /© Crown copyright/i });
    this.navigationLink = this.page.getByRole('link', { name: 'Dividing your money and property' });
    this.serviceNav = page.locator('.govuk-service-navigation');
    this.signOutBtn = page.getByRole('link', { name: 'Sign out' });
  }

  // Assert current page URL matches expected pattern
  async verifyUrl(path: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(path);
  }

  // Navigate to specified route (defaults to home)
  async goto(path: string = ROUTES.HOME): Promise<void> {
    await this.page.goto(path);
  }

  // Clear cookies, localStorage, and sessionStorage
  async clearSession(): Promise<void> {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      globalThis.localStorage.clear();
      globalThis.sessionStorage.clear();
    });
  }

  // Click the sign out link
  async signOut(): Promise<void> {
    await this.signOutBtn.click();
  }

  /**
   * Bypasses the CCD case-number lookup by hitting the test-support endpoint.
   * Sets session caseNumber and caseData (with mock access codes) then
   * redirects to /enter-access-code.
   * Only available in environments where ENABLE_TEST_SUPPORT_ROUTES=true.
   *
   * The redirect assertion is co-located here so that a missing/disabled route
   * produces an actionable error at the call site rather than a confusing URL
   * mismatch in the calling test.
   */
  async injectCaseSession(
    caseId: string,
    applicantCode: string,
    respondentCode: string
  ): Promise<void> {
    const params = new URLSearchParams({
      caseNumber: caseId,
      applicantCode,
      respondentCode,
    });
    await this.page.goto(`/__test/inject-case-session?${params.toString()}`);

    // The endpoint saves the session then redirects — wait for that redirect
    // before returning so callers can safely assert /enter-access-code state.
    await expect(
      this.page,
      '/__test/inject-case-session did not redirect to /enter-access-code. ' +
      'Check ENABLE_TEST_SUPPORT_ROUTES=true is set in this environment.'
    ).toHaveURL(/\/enter-access-code$/, { timeout: 10_000 });
  }

  // Assert multiple locators are visible
  protected async expectVisible(locators: Locator[]): Promise<void> {
    for (const locator of locators) {
      await expect(locator).toBeVisible();
    }
  }

  // Assert multiple locator attributes have expected values
  protected async expectAttributes(
    assertions: { locator: Locator; name: string; value: string }[]
  ): Promise<void> {
    for (const assertion of assertions) {
      await expect(assertion.locator).toHaveAttribute(assertion.name, assertion.value);
    }
  }
}
