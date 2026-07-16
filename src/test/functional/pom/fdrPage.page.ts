import { expect, Locator, Page } from '@playwright/test';

import { isGatewayErrorContent } from '../utils/helpers/gatewayError';
import { BasePage } from './basePage.page';
import { GettingHelpPanel } from './components/gettingHelpPanel.component';

const URL_PATTERNS = {
  DASHBOARD: /\/dashboard/,
  DOCUMENT_SELECTION: /\/upload\/document-type-selection/,
  FDR: /\/upload\/fdr/,
};

const NAVIGATION_TIMEOUT_MS = 15_000;

export class FdrPage extends BasePage {
  readonly backLink: Locator;
  readonly questionHeading: Locator;
  readonly hintText: Locator;
  readonly yesOption: Locator;
  readonly noOption: Locator;
  readonly continueButton: Locator;
  readonly inlineErrorMessage: Locator;
  readonly gettingHelp: GettingHelpPanel;

  constructor(readonly page: Page) {
    super(page);
    this.backLink = this.page.getByRole('link', { name: 'Back', exact: true });
    this.questionHeading = this.page.getByRole('heading', {
      name: 'Are you uploading these documents for a Financial Dispute Resolution hearing?',
    });
    this.hintText = this.page.getByText(
      'This should be written on the hearing notice you received from the court.',
      { exact: true }
    );
    this.yesOption = this.page.getByRole('radio', { name: 'Yes' });
    this.noOption = this.page.getByRole('radio', { name: 'No, they are for a different hearing' });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.inlineErrorMessage = this.page.getByText(
      'Select yes if you are uploading these documents for a Financial Dispute Resolution hearing'
    );
    this.gettingHelp = new GettingHelpPanel(this.page);
  }

  async verifyFdrPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.FDR);
    await this.verifyGlobalHeaderAndFooter();

    await this.expectVisible([
      this.serviceNav,
      this.navigationLink,
      this.signOutBtn,
      this.backLink,
      this.questionHeading,
      this.hintText,
      this.yesOption,
      this.noOption,
      this.continueButton,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);

    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: '/upload/confidentiality' },
    ]);
  }

  async submitWithoutSelectionAndExpectValidationError(): Promise<void> {
    await this.continueButton.click();
    await this.expectVisible([this.inlineErrorMessage]);
  }

  async selectYesAndContinue(): Promise<void> {
    await this.selectOptionAndContinue(this.yesOption);
  }

  async selectNoAndContinue(): Promise<void> {
    await this.selectOptionAndContinue(this.noOption);
  }

  private async selectOptionAndContinue(option: Locator): Promise<void> {
    // Some integration states can return directly to document selection if FDR was already answered.
    if (URL_PATTERNS.DOCUMENT_SELECTION.test(this.page.url())) {
      return;
    }

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await expect(option).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });
      await option.click();
      await expect(option).toBeChecked({ timeout: NAVIGATION_TIMEOUT_MS });
      await this.continueButton.click();

      try {
        await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION, {
          timeout: NAVIGATION_TIMEOUT_MS,
        });
        return;
      } catch (error) {
        const bodyText = await this.page.locator('body').innerText().catch(() => '');
        const shouldRetry = attempt === 1 && isGatewayErrorContent(bodyText);

        if (!shouldRetry) {
          throw error;
        }

        // AAT can transiently render a gateway page; reload once and retry submit.
        await this.page.reload({ waitUntil: 'domcontentloaded' });

        if (URL_PATTERNS.DOCUMENT_SELECTION.test(this.page.url())) {
          return;
        }

        await expect(this.page).toHaveURL(URL_PATTERNS.FDR, {
          timeout: NAVIGATION_TIMEOUT_MS,
        });
      }
    }
  }

  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection();
  }
}
