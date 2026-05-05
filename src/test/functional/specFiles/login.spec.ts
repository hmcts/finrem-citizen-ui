import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';

const IDAM_LOGOUT_REDIRECT_URL = /https:\/\/hmcts-access\..*\/(sign-in-or-create|enter-email)(?:\?.*)?$/;

test.describe('Authenticated Citizen User Journey Verification [REAL-INTEGRATION]', () => {
  /**
   * AUTOMATIC SETUP (via beforeEach)
   * By requesting 'loggedInPage', we trigger the fixtures file:
   * 1. idamApiService: Creates the helper instance.
   * 2. citizenUser: Calls the API to create a fresh user.
   * 3. loggedInPage: Navigates to the app and performs the UI login.
   */
  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    assertionHelpers: _assertionHelpers,
    axeUtils: _axeUtils,
    basePage,
  }) => {
    // The browser is already logged in here
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await basePage.verifyGlobalHeaderAndFooter();
  });

  test('[REAL-INTEGRATION] User can see access case number page after successful login @a11y', async ({ axeUtils: _axeUtils }) => {
    // No logic assertions here since the beforeEach already confirms we're on the correct page.
    await _axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[REAL-INTEGRATION] User can sign out via the UI and is redirected to IDAM @a11y', async ({ page, basePage, axeUtils: _axeUtils }) => {
    // Perform the UI-driven sign out
    await basePage.signOut();

    // Assert redirection to IDAM auth pages. IDAM can serve either route depending on flow.
    await expect(page).toHaveURL(IDAM_LOGOUT_REDIRECT_URL);

    // Verify that trying to go back to the app root redirects back to login
    await basePage.goto('/');
    await expect(page).toHaveURL(IDAM_LOGOUT_REDIRECT_URL);
    await _axeUtils.audit(DEFAULT_AXE_OPTIONS); 
  });

  test('[REAL-INTEGRATION] Verify Global Layout elements: Header, Footer, @a11y', async ({ page, basePage, axeUtils: _axeUtils }) => {
    // Verify footer links navigate correctly
    await basePage.licenceLink.click();
    await basePage.verifyUrl(/.*open-government-licence.*/);

    await page.goBack();

    await basePage.copyRightImgLink.click();
    await basePage.verifyUrl(/.*crown-copyright.*/);
    await _axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});
