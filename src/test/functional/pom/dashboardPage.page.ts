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


	async navigateToDashboard(): Promise<void> {
		await this.page.goto('/dashboard');
	}

	async verifyDashboardPageContent(): Promise<void> {
		await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);

		// Verify key content is visible
		await expect(this.dashboardHeader).toBeVisible();
		await expect(this.uploadDocumentsHeader).toBeVisible();
		await expect(this.goToDocumentUploadButton).toBeVisible();

		// Verify body text is present
		await expect(this.placeholderBodyText).toBeVisible();
		await expect(this.redirectedBodyText).toBeVisible();
		await expect(this.uploadDocumentsText).toBeVisible();

		// Verify button navigates to correct page (only functionally-relevant attribute)
		await expect(this.goToDocumentUploadButton).toHaveAttribute('href', '/upload/before-you-start');
	}

	async clickGoToDocumentUpload(): Promise<void> {
    await this.goToDocumentUploadButton.click();
  }

}
