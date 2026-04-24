import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';

// URL path constants for clarity and maintainability
const URL_PATTERNS = {
  DASHBOARD: /\/dashboard/, // Base path; allows query params
  BEFORE_YOU_START: /\/upload\/before-you-start/, // Base path; allows query params
};

export class DashboardPage extends BasePage {
  readonly dashboardHeader: Locator;
  readonly placeholderBodyText: Locator;
  readonly redirectedBodyText: Locator;
  readonly uploadDocumentsHeader: Locator;
  readonly uploadDocumentsText: Locator;
  readonly goToDocumentUploadButton: Locator;

  constructor(readonly page: Page) {
    super(page);
    this.dashboardHeader = this.page.getByRole('heading', { name: 'Financial Remedy Dashboard' });
    this.placeholderBodyText = this.page.getByText('This is a placeholder dashboard page.');
    this.redirectedBodyText = this.page.getByText(
      'You have been redirected here because you already have a linked Financial Remedy case.'
    );
    this.uploadDocumentsHeader = this.page.getByRole('heading', { name: 'Upload documents' });
    this.uploadDocumentsText = this.page.getByText('Upload documents to support your financial remedy case.');
    this.goToDocumentUploadButton = this.page.getByRole('button', { name: 'Go to document upload' });
  }

  // Navigate to the dashboard
  async navigateToDashboard(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  // Verify page URL, content visibility, and button navigation target
  async verifyDashboardPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);

    await this.expectVisible([
      this.dashboardHeader,
      this.uploadDocumentsHeader,
      this.goToDocumentUploadButton,
      this.placeholderBodyText,
      this.redirectedBodyText,
      this.uploadDocumentsText,
    ]);

    await this.expectAttributes([{ locator: this.goToDocumentUploadButton, name: 'href', value: '/upload/before-you-start' }]);
  }

  // Click the document upload button
  async clickGoToDocumentUpload(): Promise<void> {
    await this.goToDocumentUploadButton.click();
  }
}
