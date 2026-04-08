import { expect, Locator, Page } from '@playwright/test';

export class DashboardPage {
	readonly dashboardHeader: Locator;
	readonly placeholderBodyText: Locator;

	constructor(readonly page: Page) {
		this.dashboardHeader = this.page.getByRole('heading', { name: 'Financial Remedy Dashboard' });
		this.placeholderBodyText = this.page.getByText('This is a placeholder dashboard page.');
	}

	async verifyDashboardPageContent(): Promise<void> {
		await expect(this.page).toHaveURL(/\/dashboard(?:\?.*)?$/);
		await expect(this.dashboardHeader).toBeVisible();
		await expect(this.placeholderBodyText).toBeVisible();
	}
}
