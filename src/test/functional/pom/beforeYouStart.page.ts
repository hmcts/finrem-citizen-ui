import { expect, Locator, Page } from '@playwright/test';

export class BeforeYouStartPage {
  readonly beforeYouStartHeader: Locator;
  readonly startNowButton: Locator;
  readonly contactUsForHelpLink: Locator;
  

  constructor(readonly page: Page) {
    this.beforeYouStartHeader = this.page.getByRole('heading', { name: 'Before you start' });
    this.startNowButton = this.page.getByRole('link', { name: 'Start now' });
    this.contactUsForHelpLink = this.page.getByRole('link', { name: 'Contact us for help' });
  }

  async verifyBeforeYouStartPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(/\/upload\/before-you-start(?:\?.*)?$/);
    await expect(this.beforeYouStartHeader).toBeVisible();
    await expect(this.startNowButton).toBeVisible();
    await expect(this.contactUsForHelpLink).toBeVisible();
  }
}