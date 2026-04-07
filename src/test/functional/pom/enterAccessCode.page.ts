import { expect, Locator, Page } from '@playwright/test';

export class EnterAccessCodePage {
  readonly accessCodeHeader: Locator;
  readonly accessCodeInput: Locator;
  readonly accessCodeHint: Locator;
  readonly continueBtn: Locator;
  readonly errorSummary: Locator;
  readonly errorSummaryTitle: Locator;
  readonly fieldError: Locator;
  private readonly validationMessageAliases: Record<string, string | RegExp>;

  constructor(readonly page: Page) {
    this.accessCodeHeader = this.page.getByRole('heading', { name: 'Enter access code' });
    this.accessCodeInput = this.page.getByRole('textbox', { name: 'Enter access code' });
    this.accessCodeHint = this.page.locator('#accessCode-hint');
    this.continueBtn = this.page.getByRole('button', { name: 'Continue' });
    this.errorSummary = this.page.getByRole('alert');
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.fieldError = this.page.locator('#accessCode-error');
    this.validationMessageAliases = {
      'We cannot find that access code, Enter the access code sent to you':
        /Access code does not match case number|We cannot find that access code, Enter the access code sent to you/i,
    };
  }

  async verifyAccessCodePageContent(): Promise<void> {
    const elementsToCheck = [this.accessCodeHeader, this.accessCodeInput, this.accessCodeHint, this.continueBtn];

    for (const element of elementsToCheck) {
      await expect(element).toBeVisible();
    }
  }

  async submitAccessCode(accessCode: string): Promise<void> {
    await this.accessCodeInput.focus();
    await this.accessCodeInput.fill('');
    await this.accessCodeInput.fill(accessCode);
    await this.accessCodeInput.press('Tab');
    await this.continueBtn.waitFor({ state: 'visible' });
    await this.continueBtn.click();
  }

  async expectValidationError(message: string): Promise<void> {
    const resolvedMessage = this.validationMessageAliases[message] ?? message;
    await expect(this.errorSummaryTitle).toBeVisible();
    await expect(this.errorSummary.getByRole('link', { name: resolvedMessage })).toBeVisible();
    await expect(this.fieldError).toContainText(resolvedMessage);
  }

  async expectNoSpecificValidationErrors(messages: string[]): Promise<void> {
    for (const message of messages) {
      await expect(this.errorSummary.getByRole('link', { name: message })).not.toBeVisible();
    }
  }
}
