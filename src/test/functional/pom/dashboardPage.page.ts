import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';

export class DashboardPage extends BasePage {
	readonly dashboardHeader: Locator;
	readonly placeholderBodyText: Locator;
	readonly redirectedBodyText: Locator;
	readonly uploadDocumentsHeader: Locator;
	readonly uploadDocumentsText: Locator;
	readonly goToDocumentUploadButton: Locator;
	readonly unableToSendSummary: Locator;
	readonly contactUsForHelpSummary: Locator;

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
		this.unableToSendSummary = this.page.getByRole('button', { 
			name: 'I am not able to send documents to the other party' 
		});
		this.contactUsForHelpSummary = this.page.locator('summary', { 
			hasText: 'Contact us for help' 
		});
	}


	async navigateToDashboard(): Promise<void> {
		await this.page.goto('/dashboard');
	}

	async verifyDashboardPageContent(): Promise<void> {
		await expect(this.page).toHaveURL(/\/dashboard(?:\?.*)?$/);

		await this.expectVisible([
			this.dashboardHeader,
			this.placeholderBodyText,
			this.redirectedBodyText,
			this.uploadDocumentsHeader,
			this.uploadDocumentsText,
			this.goToDocumentUploadButton,
		]);

		await this.expectAttributes([
			{ locator: this.goToDocumentUploadButton, name: 'href', value: '/upload/before-you-start' },
			{ locator: this.goToDocumentUploadButton, name: 'role', value: 'button' },
			{ locator: this.goToDocumentUploadButton, name: 'draggable', value: 'false' },
			{ locator: this.goToDocumentUploadButton, name: 'data-module', value: 'govuk-button' },
		]);
	}

	async clickGoToDocumentUpload(): Promise<void> {
    await this.goToDocumentUploadButton.click();
  }

}
