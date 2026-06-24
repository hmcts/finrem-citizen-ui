import { expect, Locator, Page } from '@playwright/test';

export interface UserCredentials {
  username: string;
  password: string;
}

export class IdamPage {
  readonly signInLink: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly continueBtn: Locator;

  constructor(readonly page: Page) {
    this.signInLink = this.page.getByRole('button', { name: /sign in/i });
    this.emailInput = this.page.getByRole('textbox', { name: /enter your email/i });
    this.passwordInput = this.page.getByRole('textbox', { name: /enter your password/i });
    this.continueBtn = this.page.getByRole('button', { name: /continue/i });
  }

  /**
   * multi-step login flow:
   * Landing page -> Email -> Password
   */
  async login(user: UserCredentials): Promise<void> {
    // Reject cookie banner which can block interactions with the login flow if not dismissed.
    const rejectCookies = this.page.getByRole('button', { name: /reject .*cookies/i });
    if (await rejectCookies.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await rejectCookies.click();
    }

    const signInButton = this.page.getByRole('button', { name: /sign in/i });
    const signInLink = this.page.getByRole('link', { name: /sign in/i });
    const signInEntry = signInButton.or(signInLink).first();

    // If already on the credential step, skip the sign-in click.
    if (!(await this.emailInput.isVisible({ timeout: 2_000 }).catch(() => false))) {
      // Extended wait for slow-loading AAT login pages.
      let entryVisible = await signInEntry.isVisible({ timeout: 8_000 }).catch(() => false);

      // Pod restarts or transient gateway errors can cause /login to render without controls;
      // a single reload recovers in most cases.
      if (!entryVisible && this.page.url().includes('/login')) {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        entryVisible = await signInEntry.isVisible({ timeout: 8_000 }).catch(() => false);
      }

      if (entryVisible) {
        await expect(signInEntry).toBeVisible({ timeout: 10_000 });
        await signInEntry.click();
      } else {
        throw new Error(`Sign-in entry point not found. URL: ${this.page.url()}`);
      }
    }

    await this.emailInput.fill(user.username);
    await this.continueBtn.click();
    await this.passwordInput.waitFor({ state: 'visible', timeout: 20_000 });
    await this.passwordInput.fill(user.password);

    await Promise.all([
      this.page.waitForURL(url => !url.href.includes('sign-in-or-create'), { timeout: 30_000 }),
      this.continueBtn.click(),
    ]);

    try {
      await this.page.waitForURL(url => !url.href.includes('/oauth2/callback'), {
        timeout: 30_000,
      });
    } catch {
      throw new Error(`OIDC callback did not complete. Current URL: ${this.page.url()}`);
    }
  }

  /**
   * Clear session data
   */
  async clearSession(): Promise<void> {
    if (this.page.isClosed()) {
      return;
    }

    const context = this.page.context();

    try {
      await context.clearCookies();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Failed to find browser context')) {
        throw error;
      }
    }

    try {
      await this.page.evaluate(() => {
        globalThis.localStorage.clear();
        globalThis.sessionStorage.clear();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Target page, context or browser has been closed')) {
        throw error;
      }
    }
  }
}
