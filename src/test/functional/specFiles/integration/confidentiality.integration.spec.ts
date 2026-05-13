import { DEFAULT_AXE_OPTIONS, test } from '../../../fixtures/fixtures';
import { navigateToConfidentialityStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Confidentiality Page
 * 
 * These tests verify the confidentiality/redaction guidance page in the upload journey.
 * They rely on authenticated sessions and navigation through the standard upload flow.
 * 
 * Runs on: Environments with working authentication flow
 */

test.describe('[integration] Confidentiality page', () => {
  test.beforeEach(async ({ loggedInPage: _loggedInPage, dashboardPage, beforeYouStartPage, basePage }) => {
    await navigateToConfidentialityStep(dashboardPage, beforeYouStartPage, basePage);
  });
 
  // AC1: Page renders with correct URL and key layout elements
  test('[integration] Confidentiality page content is visible and accessible @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialityPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC2: Form C8 link is present with the correct href and opens in a new tab
  test('[integration] Form C8 link is present and correctly configured', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyFormC8Link();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC3: Redaction instructions are shown
  test('[integration] Redaction instructions are displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyRedactionInstructions();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC4: Court staff disclaimer is shown
  test('[integration] Court staff disclaimer is displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyCourtStaffDisclaimer();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC5: Confidential information examples and do-not-redact guidance are shown
  test('[integration] Confidential information examples are displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialInformationExamples();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC6: Warning message about documents being placed on the court record is shown
  test('[integration] Court record warning message is displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyCourtRecordWarning();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC7: Continue button is visible, enabled, and navigates to the FDR step
  test('[integration] Continue button navigates to FDR step @a11y', async ({
    confidentialityPage,
    fdrPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyContinueButton();
    await confidentialityPage.clickContinueAndExpectFdrStep();
    await fdrPage.verifyFdrPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  // AC8: Cancel link is visible and returns user to the dashboard
  test('[integration] Cancel button returns to dashboard @a11y', async ({
    dashboardPage,
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyCancelLink();
    await confidentialityPage.clickCancelAndExpectDashboard();
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC9: Getting help panel is collapsed by default and expands with correct contact details
  test('[integration] Getting help panel is closed by default and shows contact details when expanded @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyGettingHelpSection();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});
