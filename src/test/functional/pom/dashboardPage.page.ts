import { expect, Locator, Page } from '@playwright/test';

export class DashboardPage {
	readonly dashboardHeader: Locator;
	readonly placeholderBodyText: Locator;
	readonly uploadDocumentsHeader: Locator;
	readonly uploadDocumentsText: Locator;
	readonly goToDocumentUploadButton: Locator;

	constructor(readonly page: Page) {
		this.dashboardHeader = this.page.getByRole('heading', { name: 'Financial Remedy Dashboard' });
		this.placeholderBodyText = this.page.getByText('This is a placeholder dashboard page.');
		this.uploadDocumentsHeader = this.page.getByRole('heading', { name: 'Upload documents' });
		this.uploadDocumentsText = this.page.getByText('Upload documents to support your financial remedy case.');
		this.goToDocumentUploadButton = this.page.getByRole('button', { name: 'Go to document upload' });

	}

	async verifyDashboardPageContent(): Promise<void> {
		await expect(this.page).toHaveURL(/\/dashboard(?:\?.*)?$/);
		await expect(this.dashboardHeader).toBeVisible();
		await expect(this.placeholderBodyText).toBeVisible();
		await expect(this.uploadDocumentsHeader).toBeVisible();
		await expect(this.uploadDocumentsText).toBeVisible();
		await expect(this.goToDocumentUploadButton).toBeVisible();
	}

	async clickGoToDocumentUpload(): Promise<void> {
    await this.goToDocumentUploadButton.click();
  }

}
