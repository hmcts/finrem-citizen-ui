import { expect, test } from '../../fixtures/fixtures';

test.describe('Authenticated Citizen Journey', () => {
  test.beforeEach(async ({ homePage, idamPage, citizenUser }) => {
    test.setTimeout(60000);
    await homePage.goto();
    await idamPage.login(citizenUser);
  });

  test('User can see dashboard after successful login @PR', async ({ homePage }) => {
    await expect(homePage.page).not.toHaveURL(/.*sign-in-or-create.*/);
    await homePage.verifyCorrectContent();
  });

  test('User session can be cleared and redirects to login page @PR', async ({ page, homePage, idamPage }) => {
    await expect(homePage.page).not.toHaveURL(/.*sign-in-or-create.*/);
    await idamPage.clearSession();
    await page.goto('/');
    await expect(page).toHaveURL(/.*sign-in-or-create.*/);
    await expect(idamPage.signInLink).toBeVisible();
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
