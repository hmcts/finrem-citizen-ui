import { expect, test } from '../../../fixtures/fixtures';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';

/**
 * INTEGRATION TESTS: Authenticated User Journey
 *
 * These tests verify the login flow, authentication, and sign-out behavior.
 * They rely on IDAM integration and the loggedInPage fixture for automatic setup.
 *
 * Runs on: Environments with working IDAM integration
 */

const idamAuthEntryUrl = /https:\/\/hmcts-access\.[^/]+\/(sign-in-or-create|enter-email)(\?.*)?$/;

test.describe('[integration] Authenticated Citizen User Journey Verification', () => {
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
      basePage,
    }) => {
      // The browser is already logged in here
      await enterCaseNumberPage.verifyCaseNumberPageContent();
      await basePage.verifyGlobalHeaderAndFooter();
    });

    test('[integration] User can see access case number page after successful login @a11y', async ({ axeUtils }) => {
      // No logic assertions here since the beforeEach already confirms we're on the correct page.
      await runA11yAudit(axeUtils);
    });

    test('[integration] User can sign out via the UI and is redirected to IDAM @a11y', async ({ page, basePage, idamPage, axeUtils }) => {
      // Perform the UI-driven sign out
      await basePage.signOut();

      // Assert redirection to IDAM auth entry route.
      await expect(page).toHaveURL(idamAuthEntryUrl, { timeout: 15_000 });

      const idamAccessHeading = page.getByRole('heading', {
        name: /Sorry, you cannot access HMCTS Access from this page/i,
      });

      const idamLandingHeading = page.getByRole('heading', {
        name: /Sign in or create an account/i,
      });

      await expect(
        idamPage.emailInput.or(idamAccessHeading).or(idamLandingHeading)
      ).toBeVisible();

      // Verify that trying to go back to the app root redirects back to login
      await basePage.goto('/');
      await expect(page).toHaveURL(idamAuthEntryUrl, { timeout: 15_000 });
      await runA11yAudit(axeUtils);
    });

    test('[integration] Verify Global Layout elements: Header, Footer @a11y', async ({ page, basePage, axeUtils }) => {
      // Verify footer links navigate correctly
      await basePage.licenceLink.click();
      await basePage.verifyUrl(/.*open-government-licence.*/);

      await page.goBack();

      await basePage.copyRightImgLink.click();
      await basePage.verifyUrl(/.*crown-copyright.*/);
      await runA11yAudit(axeUtils);
    });
});
