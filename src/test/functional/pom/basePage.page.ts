import { expect, Locator, Page } from '@playwright/test';

import { AttributeAssertion, expectAttributes, expectVisible } from '../utils/helpers/pomAssertions';

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
  readonly gettingHelpHeader: Locator;
  readonly contactUsForHelpSummary: Locator;
  readonly contactUsForHelpDetails: Locator;
  readonly helpEmailLink: Locator;
  readonly helpTelephoneText: Locator;
  readonly callChargesLink: Locator;

  constructor(readonly page: Page) {
    this.headerLogo = this.page.getByRole('img', { name: 'GOV.UK' });
    this.footer = this.page.locator('footer');
    this.licenceDescription = this.footer.getByText(/All content is available under the/i);
    this.licenceLink = this.footer.getByRole('link', { name: 'Open Government Licence' });
    this.copyRightImgLink = this.footer.getByRole('link', { name: /© Crown copyright/i });
    this.navigationLink = this.page.getByRole('link', { name: 'Dividing your money and property' });
    this.serviceNav = page.locator('.govuk-service-navigation');
    this.signOutBtn = page.getByRole('link', { name: 'Sign out' });
    this.gettingHelpHeader = this.page.getByRole('heading', { name: 'Getting help' });
    this.contactUsForHelpSummary = this.page.locator('summary', { hasText: 'Contact us for help' });
    this.contactUsForHelpDetails = this.page.locator('details', { has: this.contactUsForHelpSummary });
    this.helpEmailLink = this.contactUsForHelpDetails.getByRole('link', { name: /.+@.+/ });
    this.helpTelephoneText = this.contactUsForHelpDetails.getByText('0300 123 5577');
    this.callChargesLink = this.contactUsForHelpDetails.getByRole('link', {
      name: 'Find out about call charges (opens in new tab)',
    });
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

  // Assert shared header and footer is visible
  async verifyGlobalHeaderAndFooter(): Promise<void> {
    await this.expectVisible([this.headerLogo, this.footer, this.licenceLink, this.copyRightImgLink]);
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
    await expectVisible(locators);
  }

  // Expand help panel only when collapsed
  protected async expandContactHelpIfCollapsed(): Promise<void> {
    const isExpanded = await this.contactUsForHelpDetails.getAttribute('open');
    if (isExpanded === null) {
      await this.contactUsForHelpSummary.click();
    }
    await expect(this.contactUsForHelpDetails).toHaveAttribute('open', '');
  }

  protected async verifyContactHelpClosedByDefault(): Promise<void> {
    await expect(this.contactUsForHelpDetails).not.toHaveAttribute('open', '');
  }

  protected async verifyContactHelpCoreContent(): Promise<void> {
    await this.expandContactHelpIfCollapsed();
    await this.expectVisible([this.helpEmailLink, this.helpTelephoneText, this.callChargesLink]);
    await expect(this.helpEmailLink).toHaveAttribute('href', /^mailto:.+@.+$/);
    await this.expectAttributes([
      { locator: this.callChargesLink, name: 'target', value: '_blank' },
      { locator: this.callChargesLink, name: 'rel', value: 'noopener noreferrer' },
    ]);
  }

  protected async expectAttributes(assertions: AttributeAssertion[]): Promise<void> {
    await expectAttributes(assertions);
  }
}
