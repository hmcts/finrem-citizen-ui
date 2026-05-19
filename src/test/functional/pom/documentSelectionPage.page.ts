import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';

const URL_PATTERNS = {
  DASHBOARD: /\/dashboard/,
  DOCUMENT_SELECTION: /\/upload\/upload-documents/,
  FDR: /\/upload\/fdr/,
};

export class DocumentSelectionPage extends BasePage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;

  constructor(readonly page: Page) {
    super(page);
    this.backLink = this.page.getByRole('link', { name: 'Back' });
    this.pageHeader = this.page.getByRole('heading', {
      name: 'Tell us which documents you want to upload',
    });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
  }

  async verifyDocumentSelectionPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
    await this.verifyGlobalHeaderAndFooter();

    await this.expectVisible([
      this.serviceNav,
      this.navigationLink,
      this.signOutBtn,
      this.backLink,
      this.pageHeader,
      this.continueButton,
    ]);

    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: '/upload/fdr' },
    ]);
  }

  async clickBackAndExpectFdr(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.FDR);
  }

  async clickContinueAndStayOnDocumentSelection(): Promise<void> {
    await this.continueButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
  }
}
