import { expect } from '@playwright/test';

import { BasePage } from './basePage.page';

export class HomePage extends BasePage {
  readonly heading = this.page.locator('h1.govuk-heading-xl');

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async verifyCorrectContent(): Promise<void> {
    await expect(this.heading).toHaveText('Default page template');
  }
}
