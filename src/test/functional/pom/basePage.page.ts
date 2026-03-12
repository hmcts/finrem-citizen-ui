import { Locator, Page, expect } from '@playwright/test';

export class BasePage {
  readonly headerLogo: Locator;
  readonly footer: Locator;
  readonly licenceDescription: Locator;
  readonly licenceLink: Locator;
  readonly copyRightImg: Locator;
  readonly copyRightLink: Locator;

  constructor(readonly page: Page) {
    this.headerLogo = this.page.locator('.govuk-header__logo');
    this.footer = this.page.locator('footer');
    this.licenceDescription = this.footer.locator('.govuk-footer__licence-description');
    this.licenceLink = this.footer.locator('a[rel="license"]');
    this.copyRightLink = this.footer.getByRole('link', { name: /© Crown copyright/i });
    this.copyRightImg = this.footer.locator('.govuk-footer__copyright-logo');
  }

  async verifyUrl(path: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(path);
  }
}
