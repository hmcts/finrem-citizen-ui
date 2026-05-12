import { expect, Locator, Page } from '@playwright/test';

type VerifyContactContentOptions = {
  openingHoursLocator?: Locator;
  callChargesHref?: string;
  expectedEmail?: string;
};

export class GettingHelpPanel {
  readonly heading: Locator;
  readonly summary: Locator;
  readonly details: Locator;
  readonly emailLink: Locator;
  readonly telephoneText: Locator;
  readonly callChargesLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = this.page.getByRole('heading', { name: 'Getting help' });
    this.summary = this.page.locator('summary', { hasText: 'Contact us for help' });
    this.details = this.page.locator('details', { has: this.summary });
    this.emailLink = this.page.locator('a[href^="mailto:"]').first();
    this.telephoneText = this.page.getByText('0300 123 5577');
    this.callChargesLink = this.page.getByRole('link', {
      name: 'Find out about call charges (opens in new tab)',
    });
  }

  async verifyClosedByDefault(): Promise<void> {
    await expect(this.details).not.toHaveAttribute('open', '');
  }

  async expandIfCollapsed(): Promise<void> {
    const isExpanded = await this.details.getAttribute('open');
    if (isExpanded === null) {
      await this.summary.click();
    }
    await expect(this.details).toHaveAttribute('open', '');
  }

  async collapseIfExpanded(): Promise<void> {
    const isExpanded = await this.details.getAttribute('open');
    if (isExpanded !== null) {
      await this.summary.click();
    }
    await expect(this.details).not.toHaveAttribute('open', '');
  }

  async verifyContactContent(options?: VerifyContactContentOptions): Promise<void> {
    await this.expandIfCollapsed();

    const requiredLocators: Locator[] = [
      this.emailLink,
      this.telephoneText,
      this.callChargesLink,
    ];

    if (options?.openingHoursLocator) {
      requiredLocators.push(options.openingHoursLocator);
    }

    for (const locator of requiredLocators) {
      await expect(locator).toBeVisible();
    }

    // Verify email link format, optionally matching a specific email address
    if (options?.expectedEmail) {
      await expect(this.emailLink).toHaveAttribute('href', `mailto:${options.expectedEmail}`);
    } else {
      await expect(this.emailLink).toHaveAttribute('href', /mailto:.+@.+/);
    }

    if (options?.callChargesHref) {
      await expect(this.callChargesLink).toHaveAttribute('href', options.callChargesHref);
    }

    await expect(this.callChargesLink).toHaveAttribute('target', '_blank');
    await expect(this.callChargesLink).toHaveAttribute('rel', 'noopener noreferrer');
  }
}
