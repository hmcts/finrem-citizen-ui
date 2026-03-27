import { expect,Locator, Page } from '@playwright/test';

export class EnterCaseNumberPage {
  readonly caseNumberHeader: Locator;
  readonly caseNumberInput: Locator;
  readonly caseNumberHint: Locator;
  readonly continueBtn: Locator;
  readonly errorSummary: Locator;
  readonly errorSummaryTitle: Locator;
  readonly fieldError: Locator;

  constructor(readonly page: Page) {
    this.caseNumberHeader = this.page.getByRole('heading', { name: 'Enter case number' });
    this.caseNumberInput = this.page.getByRole('textbox', { name: 'Enter case number' });
    this.caseNumberHint = this.page.locator('#caseNumber-hint');
    this.continueBtn = this.page.getByRole('button', { name: 'Continue' });
    this.errorSummary = this.page.getByRole('alert');
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.fieldError = this.page.locator('#caseNumber-error');
  }

  async verifyCaseNumberPageContent(): Promise<void> {
    const elementsToCheck = [this.caseNumberHeader, this.caseNumberInput, this.caseNumberHint, this.continueBtn];

    for (const element of elementsToCheck) {
      await expect(element).toBeVisible();
    }

    // Verify the hint text content 
    await expect(this.caseNumberHint).toHaveText('This is the 16 digit financial remedy case number that you received from the court. This is different to your divorce case number if you are also involved in divorce proceedings.');
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
