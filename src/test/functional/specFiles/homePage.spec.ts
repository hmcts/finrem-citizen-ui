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

    // Confirm back on login page
    await expect(page).toHaveURL(/.*sign-in-or-create.*/);
    await expect(idamPage.signInLink).toBeVisible();
  });

  test('User can see and interact with global header and footer elements @PR', async ({ page, homePage }) => {
    // Check Header (Top of page)
    await expect(homePage.headerLogo).toBeVisible();

    // Check Footer (Bottom of page)
    await homePage.footer.scrollIntoViewIfNeeded();
    await expect(homePage.footer).toBeVisible();

    // Check License Link (Inside Footer)
    await expect(homePage.licenceLink).toBeVisible();
    await homePage.licenceLink.click();
    await expect(page).toHaveURL(/.*open-government-licence.*/);

    await page.goBack();

    // Check Copyright Link
    await expect(homePage.copyRightImg).toBeVisible();
    await expect(homePage.copyRightImg).toHaveAttribute('href', /nationalarchives.gov.uk/);
    await homePage.copyRightImg.click();
    await expect(page).toHaveURL(/.*nationalarchives.gov.uk.*/);
  });
});
