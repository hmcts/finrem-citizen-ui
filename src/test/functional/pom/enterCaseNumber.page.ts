import { Locator, Page, expect } from '@playwright/test';

export class EnterCaseNumberPage {
  readonly caseNumberLabel: Locator;
  readonly caseNumberInput: Locator;
  readonly caseNumberHint: Locator;
  readonly continueBtn: Locator;

  constructor(readonly page: Page) {
    this.caseNumberLabel = this.page.locator('label[for="caseNumber"]');
    this.caseNumberInput = this.page.getByLabel('Case number');
    this.caseNumberHint = this.page.locator('#caseNumber-hint');
    this.continueBtn = this.page.getByRole('button', { name: 'Continue' });
  }

  async verifyCaseNumberPageContent(): Promise<void> {
    const elements = [this.caseNumberLabel, this.caseNumberInput, this.caseNumberHint, this.continueBtn];

    for (const element of elements) {
      await expect(element).toBeVisible();
    }
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
