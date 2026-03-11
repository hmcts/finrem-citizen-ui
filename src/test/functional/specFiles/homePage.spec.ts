import { expect } from '@playwright/test';

import { test } from '../../fixtures/fixtures';

test.describe('HomePage', () => {
  test.skip('User sees correct content on the home page @PR', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.verifyCorrectContent();
  });

  test.skip('User can click license link in footer and it opens in the same tab', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.clickLicenceLink();
    const urlSnippet = 'nationalarchives\\.gov\\.uk/doc/open-government-licence/version/3/';
    await page.waitForURL(new RegExp(urlSnippet));
    await expect(page).toHaveURL(new RegExp(urlSnippet));
  });

  // test('User session is destroyed after clearing cookies', async ({ idamPage, page }) => {
  //   // Verify cookies exist initially
  //   const cookiesBefore = await page.context().cookies();
  //   expect(cookiesBefore.length).toBeGreaterThan(0);

  //   // Clear session
  //   await idamPage.clearSession();

  //   // Check browser storage is empty
  //   const cookiesAfter = await page.context().cookies();
  //   const storageCheck = await page.evaluate(() => window.localStorage.length);

  //   expect(cookiesAfter.length).toBe(0);
  //   expect(storageCheck).toBe(0);

  //   // Verify application behavior (Redirect to Login page) - need to confirm url path for login page
  //   await page.goto('/home');

  //   // Check that we landed back on the IDAM login page
  //   await expect(idamPage.usernameInput).toBeVisible();
  //   await expect(page).not.toHaveURL(/\/login/);
  // });
});
