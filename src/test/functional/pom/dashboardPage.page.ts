import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';

// URL path constants for clarity and maintainability
const URL_PATTERNS = {
  DASHBOARD: /\/dashboard/, // Base path; allows query params
  BEFORE_YOU_START: /\/upload\/before-you-start/, // Base path; allows query params
};

export class DashboardPage extends BasePage {
  readonly userNameHeader: Locator;
  readonly caseNumberText: Locator;
  readonly divorceAccountHeading: Locator;
  readonly latestInformationHeading: Locator;
  readonly goToDocumentUploadButton: Locator;
  readonly viewPreviouslyUploadedLink: Locator;
  readonly iWantToHeading: Locator;
  readonly gettingHelpHeading: Locator;

  constructor(readonly page: Page) {
    super(page);
    // Use the first h1 on the page for the user name (dynamic)
    this.userNameHeader = this.page.locator('h1').first();
    this.caseNumberText = this.page.getByText(/Case number/);
    this.divorceAccountHeading = this.page.getByRole('heading', { name: 'This is your financial remedy account' });
    this.latestInformationHeading = this.page.getByRole('heading', { name: 'Latest information' });
    this.goToDocumentUploadButton = this.page.getByRole('link', { name: /Go to document upload/ });
    this.viewPreviouslyUploadedLink = this.page.getByRole('link', { name: 'View previously uploaded documents' });
    this.iWantToHeading = this.page.getByRole('heading', { name: 'I want to...' });
    this.gettingHelpHeading = this.page.getByRole('heading', { name: 'Getting help' });
  }

  // Navigate to the dashboard
  async navigateToDashboard(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  // Verify page URL, content visibility, and button navigation target
  async verifyDashboardPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);

    await this.expectVisible([
      this.userNameHeader,
      this.caseNumberText,
      this.divorceAccountHeading,
      this.latestInformationHeading,
      this.goToDocumentUploadButton,
      this.viewPreviouslyUploadedLink,
      this.iWantToHeading,
      this.gettingHelpHeading,
    ]);

    await this.expectAttributes([{ locator: this.goToDocumentUploadButton, name: 'href', value: '/upload/before-you-start' }]);
  }

  // Click the document upload button
  async clickGoToDocumentUpload(): Promise<void> {
    await this.goToDocumentUploadButton.click();
  }
}
