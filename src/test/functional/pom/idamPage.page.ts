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
  readonly forgottenPasswordLink: Locator;

  constructor(readonly page: Page) {
    this.signInLink = this.page.getByRole('button', { name: /sign in/i });
    this.emailInput = this.page.locator('#email');
    this.passwordInput = this.page.locator('#password');
    this.continueBtn = this.page.locator('button[type="submit"]', { hasText: 'Continue' });
    this.forgottenPasswordLink = this.page.getByRole('link', { name: 'I have forgotten my password' });
    this.continueBtn = this.page.getByRole('button', { name: /continue/i });
  }

  /**
   * multi-step login flow:
   * Landing page -> Email -> Password
   */
  async login(user: UserCredentials): Promise<void> {
    // Landing Page
    await this.signInLink.click();

    // Email
    await this.emailInput.fill(user.username);
    await this.continueBtn.click();
    await this.passwordInput.waitFor({ state: 'visible' });

    // Password
    await this.passwordInput.fill(user.password);

    // Final Submission - wrapped in a Promise.all because this IS the redirect point.
    await Promise.all([
      this.page.waitForResponse(res => res.status() === 200 && !res.url().includes('sign-in-or-create'), {
        timeout: 20000,
      }),
      this.page.waitForURL(url => !url.href.includes('sign-in-or-create'), {
        timeout: 20000,
      }),
      this.continueBtn.click(),
    ]);

    // Verify no longer on the login page
    await expect(this.page).not.toHaveURL(/.*sign-in-or-create.*/);
    await expect(this.passwordInput).not.toBeVisible();
  }

  /**
   * Clear session data
   */
  async clearSession(): Promise<void> {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  }

  async clickSignIn(): Promise<void> {
    await this.signInLink.click();
  }

  async enterEmail(user: UserCredentials): Promise<void> {
    await this.emailInput.fill(user.username);
  }

  async continueAfterEmail(): Promise<void> {
    await this.continueBtn.click();
  }
 
  async clickForgottenPassword(): Promise<void> {
    await expect(this.forgottenPasswordLink).toBeVisible();
    await this.forgottenPasswordLink.click();
  }

//verify on the forgotten password page by checking URL and key elements
  async verifyOnForgottenPasswordPage(): Promise<void> {
    await expect(this.page).toHaveURL(/.*reset-password-check-email.*/);
    await expect(this.page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'request another password reset email' })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'contact us for help' })).toBeVisible();
  
  }

}
