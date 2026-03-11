import { Locator, Page, expect } from '@playwright/test';

export class BasePage {
  readonly headerLogo: Locator;
  readonly footer: Locator;
  readonly licenceLink: Locator;
  readonly copyRightImg: Locator;

  constructor(readonly page: Page) {
    this.headerLogo = this.page.locator('.govuk-header__logo');
    this.footer = this.page.locator('footer');
    this.licenceLink = this.footer.locator('a[rel="license"]');
    this.copyRightImg = this.footer.getByRole('link', { name: /© Crown copyright/i });
  }

  async verifyUrl(path: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(path);
  }
}
