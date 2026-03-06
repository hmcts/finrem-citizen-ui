import { Locator, Page, expect } from '@playwright/test';

export class HomePage {
  private readonly heading: Locator;
  private readonly headerLogo: Locator;
  private readonly footer: Locator;
  private readonly licenceLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = this.page.locator('h1.govuk-heading-xl');
    this.headerLogo = this.page.locator('div.govuk-header__logo');
    this.footer = this.page.locator('footer');
    this.licenceLink = this.page.locator('a.govuk-footer__link[rel="license"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async verifyCorrectContent(): Promise<void> {
    await expect(this.heading).toHaveText('Sign in or create an account');
    await expect(this.page).toHaveURL(/.*login.*/);
  }

  async clickLicenceLink(): Promise<void> {
    await this.licenceLink.click();
  }

  async clickLinkByText(linkText: string): Promise<void> {
    await this.page.getByRole('link', { name: linkText, exact: false }).click();
  }

  async verifyCurrentPageUrlContains(path: string): Promise<void> {
    const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(this.page).toHaveURL(new RegExp(escapedPath));
  }
}
