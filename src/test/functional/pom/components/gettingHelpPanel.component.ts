import { expect, Locator, Page } from '@playwright/test';

type VerifyContactContentOptions = {
  openingHoursLocator?: Locator;
  callChargesHref?: string;
  expectedEmail?: string;
};

export class GettingHelpPanel {
  readonly container: Locator;
  readonly heading: Locator;
  readonly summary: Locator;
  readonly details: Locator;
  readonly toggle: Locator;
  readonly emailLink: Locator;
  readonly telephoneText: Locator;
  readonly callChargesLink: Locator;

  constructor(private readonly page: Page) {
    this.container = this.page.getByRole('complementary');
    this.heading = this.container.getByRole('heading', { name: 'Getting help' });
    this.details = this.container.locator('details').filter({ hasText: 'Contact us for help' });

    this.summary = this.details.locator('summary').filter({ hasText: 'Contact us for help' });
    this.toggle = this.summary;

    this.emailLink = this.details.getByRole('link').filter({ hasText: /@/ });
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
      await this.toggle.click();
    }
    await expect(this.details).toHaveAttribute('open', '');
  }

  async collapseIfExpanded(): Promise<void> {
    const isExpanded = await this.details.getAttribute('open');
    if (isExpanded !== null) {
      await this.toggle.click();
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

  async verifySection(options?: VerifyContactContentOptions): Promise<void> {
    await this.verifyClosedByDefault();
    await this.verifyContactContent(options);
  }
}
