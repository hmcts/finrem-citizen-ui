import { Locator, Page, expect } from '@playwright/test';

export class EnterCaseNumberPage {
  readonly caseNumberInput: Locator;
  readonly caseNumberLabel: Locator;
  readonly caseNumberHint: Locator;
  readonly continueBtn: Locator;

  constructor(readonly page: Page) {
    this.caseNumberInput = this.page.getByLabel('Case number');
    this.caseNumberLabel = this.page.locator('label[for="caseNumber"]');
    this.caseNumberHint = this.page.locator('#caseNumber-hint');
    this.continueBtn = this.page.getByRole('button', { name: 'Continue' });
  }

  async verifyCaseNumberPageContent(): Promise<void> {
    await expect(this.caseNumberInput).toBeVisible();
    await expect(this.caseNumberLabel).toBeVisible();
    await expect(this.caseNumberHint).toBeVisible();
    await expect(this.continueBtn).toBeVisible();
  }

    async enterValidCaseNumber(caseNumber: string): Promise<void> {
    await this.caseNumberInput.fill(caseNumber);
    await this.continueBtn.click();
  }

    async enterInvalidCaseNumber(caseNumber: string): Promise<void> {  
    await this.caseNumberInput.fill(caseNumber);
    await this.continueBtn.click();
  }
}