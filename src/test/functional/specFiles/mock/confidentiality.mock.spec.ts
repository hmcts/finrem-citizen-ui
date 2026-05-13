import { DEFAULT_AXE_OPTIONS, test } from '../../../fixtures/fixtures';
import { BasePage } from '../../pom/basePage.page';
import { BeforeYouStartPage } from '../../pom/beforeYouStart.page';
import { DashboardPage } from '../../pom/dashboardPage.page';

/**
 * MOCK-ONLY TESTS: Confidentiality Page
 * 
 * These tests verify the confidentiality/redaction guidance page in the upload journey.
 * They rely on authenticated sessions and navigation through the standard upload flow.
 * 
 * Runs on: Local environment
 * Does NOT run on: Preview, AAT as mock tests
 */

async function navigateToConfidentialityPage(
  dashboardPage: DashboardPage,
  beforeYouStartPage: BeforeYouStartPage,
  basePage: BasePage
): Promise<void> {
  await dashboardPage.navigateToDashboard();
  await dashboardPage.clickGoToDocumentUpload();
  await beforeYouStartPage.startUploadJourney();
  await basePage.verifyGlobalHeaderAndFooter();
}
 
test.describe('[mock] Confidentiality page', () => {
  test.beforeEach(async ({ loggedInPage: _loggedInPage, dashboardPage, beforeYouStartPage, basePage }) => {
    await navigateToConfidentialityPage(dashboardPage, beforeYouStartPage, basePage);
  });
 
  // AC1: Page renders with correct URL and key layout elements
  test('[mock] Confidentiality page content is visible and accessible @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialityPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC2: Form C8 link is present with the correct href and opens in a new tab
  test('[mock] Form C8 link is present and correctly configured @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyFormC8Link();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC3: Redaction instructions are shown
  test('[mock] Redaction instructions are displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyRedactionInstructions();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC4: Court staff disclaimer is shown
  test('[mock] Court staff disclaimer is displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyCourtStaffDisclaimer();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC5: Confidential information examples and do-not-redact guidance are shown
  test('[mock] Confidential information examples are displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialInformationExamples();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC6: Warning message about documents being placed on the court record is shown
  test('[mock] Court record warning message is displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyCourtRecordWarning();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC7: Continue button is visible, enabled, and navigates to the next upload step
  test('[mock] Continue button navigates to upload step @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyContinueButton();
    await confidentialityPage.clickContinueAndExpectUploadStep();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  // AC8: Cancel link is visible and returns user to the dashboard
  test('[mock] Cancel button returns to dashboard @a11y', async ({
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
  test('[mock] Getting help panel is closed by default and shows contact details when expanded @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyContactHelpClosedByDefault();
    await confidentialityPage.verifyContactHelpContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});
