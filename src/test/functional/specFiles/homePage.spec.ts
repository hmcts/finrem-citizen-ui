import { expect, test } from '../../fixtures/fixtures';

test.describe('Authenticated Citizen User Journey', () => {
  /**
   * AUTOMATIC SETUP (via beforeEach)
   * By requesting 'loggedInPage', we trigger the fixtures file:
   * 1. idamApiService: Creates the helper instance.
   * 2. citizenUser: Calls the API to create a fresh user.
   * 3. loggedInPage: Navigates to the app and performs the UI login.
   */
  test.beforeEach(async ({ loggedInPage: _loggedInPage }) => {
    // The browser is already at the dashboard here
  });

  test('User can see dashboard after successful login @PR', async ({ homePage }) => {
    // Verify dashboard elements
    await homePage.verifyDashboardContent();
  });

  test('User session can be cleared and redirects to login page @PR', async ({ page, homePage, idamPage }) => {
    // Perform the logout/session clear action
    await homePage.clearSession();
    await page.goto('/');

    // Assert user is back on login screen
    await expect(page).toHaveURL(/.*sign-in-or-create.*/);
    await expect(idamPage.signInLink).toBeVisible();
  });

  test('Verify Global Layout elements: Header, Footer, @PR', async ({ page, homePage }) => {
    // common elements from the Page Object for easier access
    const { footer, licenceDescription, licenceLink, copyRightImgLink } = homePage;

    // Check header
    await expect(homePage.headerLogo).toBeVisible();

    // Check footer (License description and Link navigates to the correct page)
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(licenceDescription).toBeVisible();
    await licenceLink.click();
    await homePage.verifyUrl(/.*open-government-licence.*/);

    await page.goBack();

    // Check footer (Copyright Image link navigates to the correct page)
    await copyRightImgLink.click();
    await homePage.verifyUrl(/.*crown-copyright.*/);
  });

  // Test to verify entering a case number 
  test('User can enter a valid case number and proceed @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await enterCaseNumberPage.enterValidCaseNumber('1234567890123456');// Valid case number (16-20digits)
  });

  //Test to verify entering an invalid case number and not proceeding
  test('User cannot proceed with an invalid case number @PR', async ({ enterCaseNumberPage }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await enterCaseNumberPage.enterInvalidCaseNumber('1234'); // Invalid case number (too short)
    // Verify that we are still on the same page 
    await expect(enterCaseNumberPage.caseNumberInput).toBeVisible();
  });

});
