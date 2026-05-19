import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';

const URL_PATTERNS = {
  DASHBOARD: /\/dashboard/,
  DOCUMENT_SELECTION: /\/upload\/document-selection/,
  FDR: /\/upload\/fdr/,
};

export class DocumentSelectionPage extends BasePage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;
  readonly cancelLink: Locator;

  constructor(readonly page: Page) {
    super(page);
    this.backLink = this.page.getByRole('link', { name: 'Back' });
    this.pageHeader = this.page.getByRole('heading', {
      name: 'Tell us which documents you want to upload',
    });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.cancelLink = this.page.getByRole('link', { name: 'Cancel' });
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
      this.cancelLink,
    ]);

    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: '/upload/fdr' },
      { locator: this.cancelLink, name: 'href', value: '/dashboard' },
    ]);
  }

  async clickBackAndExpectFdr(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.FDR);
  }

  async clickContinueAndStayOnDocumentSelection(): Promise<void> {
    await this.continueButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
    await expect(this.pageHeader).toBeVisible();
  }

  async clickCancelAndExpectDashboard(): Promise<void> {
    await this.cancelLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);
  }
}
