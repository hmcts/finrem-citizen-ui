import { Locator, Page } from '@playwright/test';

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
    this.emailInput = this.page.locator('#email');
    this.passwordInput = this.page.locator('#password');
    this.continueBtn = this.page.getByRole('button', { name: /continue/i });
  }

  private isIgnorableSessionClearError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);

    return message.includes('Failed to find browser context')
      || message.includes('Target page, context or browser has been closed')
      || message.includes('Execution context was destroyed')
      || message.includes('Cannot find context with specified id')
      || message.includes('SecurityError')
      || message.includes('Access is denied for this document');
  }

  /**
   * multi-step login flow:
   * Landing page -> Email -> Password
   */
  async login(user: UserCredentials): Promise<void> {
    const authErrorHeading = this.page.getByRole('heading', {
      name: /Access to this resource requires authorisation/i,
    });

    // Reject cookie banner which can block interactions with the login flow if not dismissed.
    const rejectCookies = this.page.getByRole('button', { name: /reject .*cookies/i });
    if (await rejectCookies.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await rejectCookies.click();
    }

    const signInButton = this.page.getByRole('button', { name: /sign in/i });
    const signInLink = this.page.getByRole('link', { name: /sign in/i });

    // If already on credential step, skip sign-in click.
    if (!(await this.emailInput.isVisible({ timeout: 2_000 }).catch(() => false))) {
      if (await signInButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await signInButton.click();
      } else if (await signInLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await signInLink.click();
      } else if (await authErrorHeading.isVisible({ timeout: 3_000 }).catch(() => false)) {
        throw new Error(`IDAM authorisation page shown before sign-in. URL: ${this.page.url()}`);
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
      if (!this.isIgnorableSessionClearError(error)) {
        throw error;
      }
    }

    // Best-effort stabilization if retry starts while a redirect is still in flight.
    await this.page.waitForLoadState('domcontentloaded', { timeout: 3_000 }).catch(() => undefined);

    for (let attempt = 0; attempt < 2; attempt++) {
      if (this.page.isClosed()) {
        return;
      }

      try {
        await this.page.evaluate(() => {
          globalThis.localStorage.clear();
          globalThis.sessionStorage.clear();
        });
        return;
      } catch (error) {
        if (!this.isIgnorableSessionClearError(error)) {
          throw error;
        }

        await this.page.waitForLoadState('domcontentloaded', { timeout: 2_000 }).catch(() => undefined);
      }
    }
  }
}
