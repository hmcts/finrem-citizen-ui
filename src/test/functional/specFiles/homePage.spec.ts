import { expect } from '@playwright/test';

import { test } from '../../fixtures/fixtures';

test.describe('Finrem Citizen UI - Authenticated Session', () => {
  // Setup and teardown for authenticated tests
  test.beforeEach(async ({ idamApi, idamPage, homePage, page }) => {
    const user = await idamApi.createCitizenUser();
    await homePage.goto();
    await idamPage.login(user);
    await expect(page).toHaveURL(/\/home/);
  });

  test.afterEach(async ({ idamPage }) => {
    await idamPage.clearSession();
  });

  test('User sees correct content on home page @PR', async ({ homePage }) => {
    await homePage.verifyCorrectContent();
  });

  test('User can navigate to footer links while logged in', async ({ homePage, page }) => {
    await homePage.clickLicenceLink();
    const urlSnippet = 'nationalarchives\\.gov\\.uk/doc/open-government-licence/version/3/';
    await page.waitForURL(new RegExp(urlSnippet));
    await expect(page).toHaveURL(new RegExp(urlSnippet));
  });

  test('User session is destroyed after clearing cookies', async ({ idamPage, page }) => {
    // Verify cookies exist initially
    const cookiesBefore = await page.context().cookies();
    expect(cookiesBefore.length).toBeGreaterThan(0);

    // Clear session
    await idamPage.clearSession();

    // Check browser storage is empty
    const cookiesAfter = await page.context().cookies();
    const storageCheck = await page.evaluate(() => window.localStorage.length);

    expect(cookiesAfter.length).toBe(0);
    expect(storageCheck).toBe(0);

    // Verify application behavior (Redirect to Login page) - need to confirm url path for login page
    await page.goto('/home');

    // Check that we landed back on the IDAM login page
    await expect(idamPage.usernameInput).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });
});
