import { Locator, Page, expect } from '@playwright/test';

export interface UserCredentials {
  username: string;
  password: string;
}

export class IdamPage {
  readonly signInLink: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly continueBtn: Locator;

  constructor(public readonly page: Page) {
    this.signInLink = this.page.getByRole('button', { name: 'Sign in', exact: true });
    this.emailInput = this.page.locator('#email');
    this.passwordInput = this.page.locator('#password');
    this.continueBtn = this.page.locator('button[type="submit"]', { hasText: 'Continue' });
  }

  /**
   * multi-step login flow:
   * Landing page -> Email -> Password
   */
  async login(user: UserCredentials): Promise<void> {
    // Landing Page
    await this.signInLink.click();

    // Enter Email
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(user.username);
    await this.continueBtn.click();

    // Enter Password and Capture Response
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.passwordInput.fill(user.password);

    // Catch successful auth response
    const responsePromise = this.page.waitForResponse(
      res => res.status() === 200 && !res.url().includes('sign-in-or-create'),
      { timeout: 20000 }
    );

    await this.continueBtn.click();

    // Wait for the 200 OK response to be confirmed
    await responsePromise;

    // Final Verification
    await expect(this.passwordInput).not.toBeVisible();
  }

  /**
   * Clears session data
   */
  async clearSession(): Promise<void> {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  }
}
