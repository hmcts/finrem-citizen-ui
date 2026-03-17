import { Locator, Page, expect } from '@playwright/test';

export class EnterCaseNumberPage {
  readonly caseNumberInput: Locator;
  readonly caseNumberHint: Locator;
  readonly continueBtn: Locator;
  readonly errorSummary: Locator;
  readonly errorSummaryTitle: Locator;
  readonly fieldError: Locator;

  constructor(readonly page: Page) {
    this.caseNumberInput = this.page.getByLabel('Case number');
    this.caseNumberHint = this.page.locator('#caseNumber-hint');
    this.continueBtn = this.page.getByRole('button', { name: 'Continue' });
    this.errorSummary = this.page.getByRole('alert');
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.fieldError = this.page.locator('#caseNumber-error');
  }

  async verifyCaseNumberPageContent(): Promise<void> {
    await expect(this.caseNumberInput).toBeVisible();
    await expect(this.continueBtn).toBeVisible();
  }

  async submitCaseNumber(caseNumber: string): Promise<void> {
    await this.caseNumberInput.focus();
    await this.caseNumberInput.fill('');
    await this.caseNumberInput.fill(caseNumber);
    await this.caseNumberInput.press('Tab');
    await this.continueBtn.waitFor({ state: 'visible' });
    await this.continueBtn.click();
  }

  async expectValidationError(message: string): Promise<void> {
    await expect(this.errorSummaryTitle).toBeVisible();
    await expect(this.errorSummary.getByRole('link', { name: message })).toBeVisible();
    await expect(this.fieldError).toContainText(message);
  }

  async expectNoSpecificValidationErrors(messages: string[]): Promise<void> {
    for (const message of messages) {
      await expect(this.errorSummary.getByRole('link', { name: message })).not.toBeVisible();
    }
  }
}
