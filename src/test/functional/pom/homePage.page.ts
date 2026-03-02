import { Page, expect } from '@playwright/test';

export class HomePage {
  private readonly heading;
  private readonly headerLogo;
  private readonly footer;
  private readonly licenceLink;

  constructor(private page: Page) {
    this.heading = this.page.locator('h1.govuk-heading-xl');
    this.headerLogo = this.page.locator('div.govuk-header__logo');
    this.footer = this.page.locator('footer');
    this.licenceLink = this.page.locator('a.govuk-footer__link[rel="license"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async verifyCorrectContent(): Promise<void> {
    await expect(this.heading).toHaveText('Default page template');
    await expect(this.headerLogo).toBeVisible();
    await expect(this.footer).toContainText('All content is available under the');
    await expect(this.licenceLink).toHaveText('Open Government Licence v3.0');
  }

  async clickLicenceLink(): Promise<void> {
    await this.licenceLink.click();
  }

  async clickLinkByText(linkText: string): Promise<void> {
    // Added return type
    await this.page.getByRole('link', { name: linkText, exact: false }).click();
  }

  /**
   * Verifies that the current page's URL contains a specific path/substring.
   * @param path The substring expected in the URL.
   */
  async verifyCurrentPageUrlContains(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path));
  }
}
