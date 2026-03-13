import { Locator, Page, expect } from '@playwright/test';

export class BasePage {
  readonly headerLogo: Locator;
  readonly footer: Locator;
  readonly licenceDescription: Locator;
  readonly licenceLink: Locator;
  readonly copyRightImgLink: Locator;

  constructor(readonly page: Page) {
    this.headerLogo = this.page.getByRole('img', { name: 'GOV.UK' });
    this.footer = this.page.locator('footer');
    this.licenceDescription = this.footer.getByText(/All content is available under the/i);
    this.licenceLink = this.footer.getByRole('link', { name: 'Open Government Licence' });
    this.copyRightImgLink = this.footer.getByRole('link', { name: /© Crown copyright/i });
  }

  async verifyUrl(path: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(path);
  }
}
