import { expect, test } from '../../fixtures/fixtures';

test.describe('Authenticated Citizen Journey', () => {
  // This runs before every test in this describe block
  test.beforeEach(async ({ homePage, idamPage, citizenUser }) => {
    await homePage.goto();
    await homePage.page.waitForLoadState('networkidle');
    await idamPage.login(citizenUser);
  });

  test('User is successfully logged in and sees dashboard @PR', async ({ page, homePage, citizenUser }) => {
    await expect(page).not.toHaveURL(/.*sign-in-or-create.*/);
    await homePage.verifyCorrectContent();

    console.log(`Tested with user: ${citizenUser.username}`);
  });

  test('User session can be cleared and redirects to login page @PR', async ({ page, idamPage }) => {
    // Verify logged in
    await expect(page).not.toHaveURL(/.*sign-in-or-create.*/);

    // Clear session
    await idamPage.clearSession();
    await page.reload();

    await page.goto('/');

    // 4. Confirm back on login page
    await expect(page).toHaveURL(/.*sign-in-or-create.*/);
    await expect(idamPage.signInLink).toBeVisible();
  });
});
