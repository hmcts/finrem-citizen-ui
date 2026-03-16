import { Locator, Page } from '@playwright/test';

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

    async enterCaseNumber(caseNumber: string): Promise<void> {
    await this.caseNumberInput.fill(caseNumber);
    await this.continueBtn.click();
  }

}