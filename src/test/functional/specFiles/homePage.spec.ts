import { expect, test } from '../../fixtures/fixtures';

test.describe('Authenticated Citizen Journey', () => {
  // These tests use the global storageState defined in playwright.config.ts
  test.describe('User Logged in as Citizen User and HomePage Validated', () => {
    test.beforeEach(async ({ homePage }) => {
      test.setTimeout(60000);
      await homePage.goto();
    });

    test('User can see dashboard after successful login @PR', async ({ homePage }) => {
      await expect(homePage.page).not.toHaveURL(/.*sign-in-or-create.*/);
      await homePage.verifyCorrectContent();
    });

    test('Verify Global Layout elements: Header, Footer, CopyRight, LicenceLink @PR', async ({ page, homePage }) => {
      await expect(homePage.headerLogo).toBeVisible();

      const { footer, licenceLink, copyRightImg } = homePage;
      await footer.scrollIntoViewIfNeeded();

      // Check License
      await licenceLink.click();
      await homePage.verifyUrl(/.*open-government-licence.*/);
      await page.goBack();

      // Check Copyright
      await expect(copyRightImg).toHaveAttribute('href', /nationalarchives.gov.uk/);
      await copyRightImg.click();
      await homePage.verifyUrl(/.*nationalarchives.gov.uk.*/);
    });
  });

  // This test clears the session, so we keep it separate
  test.describe('Session Management, cookies are not persisted', () => {
    test('User session can be cleared and redirects to login page @PR', async ({ page, homePage, idamPage }) => {
      await homePage.goto();
      // Confirm we started logged in from the global state
      await expect(page).not.toHaveURL(/.*sign-in-or-create.*/);

      await idamPage.clearSession();
      await page.goto('/');

      // Verify redirection
      await expect(page).toHaveURL(/.*sign-in-or-create.*/);
      await expect(idamPage.signInLink).toBeVisible();
    });
  });
});
