import { expect, test } from '../../fixtures/fixtures';



test.describe('Authenticated Citizen User Journey Verification', () => {
  /**
   * AUTOMATIC SETUP (via beforeEach)
   * By requesting 'loggedInPage', we trigger the fixtures file:
   * 1. idamApiService: Creates the helper instance.
   * 2. citizenUser: Calls the API to create a fresh user.
   * 3. loggedInPage: Navigates to the app and performs the UI login.
   */
  test.beforeEach(async ({ loggedInPage: _loggedInPage }) => {
    // The browser is already logged in here
  });

  test('User can see access case number page after successful login @PR', async ({ basePage, enterCaseNumberPage, page }) => {
    await expect(basePage.navigationLink).toBeVisible();
    await enterCaseNumberPage.verifyCaseNumberPageContent();
  });

  test('User can sign out via the UI and is redirected to IDAM @PR', async ({ page, basePage, idamPage }) => {
    // Perform the UI-driven sign out
    await basePage.signOut();

    // Assert redirection to IDAM (Sign-in page)
    await expect(page).toHaveURL(/.*sign-in-or-create.*/);
    await expect(idamPage.signInLink).toBeVisible();

    // Verify that trying to go back to the app root redirects back to login
    await basePage.goto('/');
    await expect(page).toHaveURL(/.*sign-in-or-create.*/);
  });

  test('Verify Global Layout elements: Header, Footer, @PR', async ({ page, basePage }) => {
    // common elements from the Page Object for easier access
    const { footer, licenceDescription, licenceLink, copyRightImgLink } = basePage;

    // Check header
    await expect(basePage.headerLogo).toBeVisible();

    // Check footer (License description and Link navigates to the correct page)
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(licenceDescription).toBeVisible();
    await licenceLink.click();
    await basePage.verifyUrl(/.*open-government-licence.*/);

    await page.goBack();

    // Check footer (Copyright Image link navigates to the correct page)
    await copyRightImgLink.click();
    await basePage.verifyUrl(/.*crown-copyright.*/);
  });

  test.skip('forgotten password link navigates to correct page', async ({ basePage, idamPage, citizenUser }) => {
    await basePage.signOut();
    await idamPage.clickSignIn();
    await idamPage.enterEmail(citizenUser);
    await idamPage.continueAfterEmail();
    await idamPage.clickForgottenPassword();
    await idamPage.verifyOnForgottenPasswordPage();
  });


});
