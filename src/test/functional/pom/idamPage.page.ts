import { Locator, Page, expect } from '@playwright/test';

export interface UserCredentials {
  username: string;
  password: string;
}

export class IdamPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;

  constructor(public readonly page: Page) {
    this.usernameInput = this.page.locator('#username');
    this.passwordInput = this.page.locator('#password');
    this.submitBtn = this.page.locator('button[type="submit"]');
  }

  async login(user: UserCredentials): Promise<void> {
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.submitBtn.click();
    await expect(this.usernameInput).not.toBeVisible();
  }

  async clearSession(): Promise<void> {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => window.localStorage.clear());
  }
}
