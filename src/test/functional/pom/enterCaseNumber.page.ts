import { expect, Locator, Page } from '@playwright/test';

import { expectVisible } from '../utils/helpers/pomAssertions';

export class EnterCaseNumberPage {
  readonly caseNumberHeader: Locator;
  readonly caseNumberInput: Locator;
  readonly caseNumberHint: Locator;
  readonly continueBtn: Locator;
  readonly errorSummary: Locator;
  readonly errorSummaryTitle: Locator;
  readonly fieldError: Locator;

  constructor(readonly page: Page) {
    this.caseNumberHeader = this.page.getByRole('heading', { name: 'Case number' });
    this.caseNumberInput = this.page.getByRole('textbox', { name: 'Enter your case number' });
    this.caseNumberHint = this.page.locator('#caseNumber-hint');
    this.continueBtn = this.page.getByRole('button', { name: 'Continue' });
    this.errorSummary = this.page.getByRole('alert');
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.fieldError = this.page.locator('#caseNumber-error');
  }

  async verifyCaseNumberPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(/\/enter-case-number$/);
    await expectVisible([this.caseNumberHeader, this.caseNumberInput, this.caseNumberHint, this.continueBtn]);
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
    await expectVisible([
      this.errorSummaryTitle,
      this.errorSummary.getByRole('link', { name: message }),
    ]);
    await expect(this.fieldError).toContainText(message);
  }

  async expectNoSpecificValidationErrors(messages: string[]): Promise<void> {
    for (const message of messages) {
      await expect(this.errorSummary.getByRole('link', { name: message })).not.toBeVisible();
    }
  }
}
