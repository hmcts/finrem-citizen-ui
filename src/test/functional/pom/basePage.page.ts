import { Locator, Page, expect } from '@playwright/test';

// Option A: Move it outside the class (Cleaner if other pages need it too)
const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
};

export class BasePage {
  readonly headerLogo: Locator;
  readonly footer: Locator;
  readonly licenceDescription: Locator;
  readonly licenceLink: Locator;
  readonly copyRightImgLink: Locator;
  readonly navigationLink: Locator;
  readonly serviceNav: Locator;
  readonly signOutBtn: Locator;

  constructor(readonly page: Page) {
    this.headerLogo = this.page.getByRole('img', { name: 'GOV.UK' });
    this.footer = this.page.locator('footer');
    this.licenceDescription = this.footer.getByText(/All content is available under the/i);
    this.licenceLink = this.footer.getByRole('link', { name: 'Open Government Licence' });
    this.copyRightImgLink = this.footer.getByRole('link', { name: /© Crown copyright/i });
    this.navigationLink = this.page.getByRole('link', { name: 'Dividing your money and property' });
    this.serviceNav = page.locator('.govuk-service-navigation');
    this.signOutBtn = page.getByRole('link', { name: 'Sign out' });
  }

  async verifyUrl(path: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(path);
  }

  // Uses the ROUTES constant defined above
  async goto(path: string = ROUTES.HOME): Promise<void> {
    await this.page.goto(path);
  }

  async clearSession(): Promise<void> {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  }

  async signOut(): Promise<void> {
    await this.signOutBtn.click();
  }
}
