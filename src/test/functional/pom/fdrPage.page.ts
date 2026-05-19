import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GettingHelpPanel } from './components/gettingHelpPanel.component';

const URL_PATTERNS = {
  DASHBOARD: /\/dashboard/,
  DOCUMENT_SELECTION: /\/upload\/upload-documents/,
  FDR: /\/upload\/fdr/,
};

// FDR = Financial Dispute Resolution.
const FDR_EMAIL = 'FRCexample@justice.gov.uk';

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
    this.backLink = this.page.getByRole('link', { name: 'Back' });
    this.questionHeading = this.page.getByRole('heading', {
      name: 'Are you uploading these documents for a Financial Dispute Resolution hearing?',
    });
    this.hintText = this.page.getByText(
      'This should be written on the hearing notice you received from the court.',
      { exact: true }
    );
    this.yesOption = this.page.getByLabel('Yes');
    this.noOption = this.page.getByLabel('No, they are for a different hearing');
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.inlineErrorMessage = this.page.getByText(
      /Error:\s*Select yes if you are uploading these documents for a Financial Dispute Resolution hearing/i
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
    await this.yesOption.check();
    await this.continueButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
  }

  async selectNoAndContinue(): Promise<void> {
    await this.noOption.check();
    await this.continueButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
  }

  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection({ expectedEmail: FDR_EMAIL });
  }
}
