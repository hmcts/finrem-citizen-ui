import { DEFAULT_AXE_OPTIONS, test } from '../../fixtures/fixtures';

async function navigateToConfidentialityPage(
  dashboardPage: {
    navigateToDashboard: () => Promise<void>;
    clickGoToDocumentUpload: () => Promise<void>;
  },
  beforeYouStartPage: {
    startUploadJourney: () => Promise<void>;
  },
  basePage: {
    verifyGlobalHeaderAndFooter: () => Promise<void>;
  }
): Promise<void> {
  await dashboardPage.navigateToDashboard();
  await dashboardPage.clickGoToDocumentUpload();
  await beforeYouStartPage.startUploadJourney();
  await basePage.verifyGlobalHeaderAndFooter();
}
 
test.describe('Confidentiality page @PR', () => {
  test.beforeEach(async ({ loggedInPage: _loggedInPage, dashboardPage, beforeYouStartPage, basePage }) => {
    await navigateToConfidentialityPage(dashboardPage, beforeYouStartPage, basePage);
  });
 
  // AC1: Page renders with correct URL and key layout elements
  test('Confidentiality page content is visible and accessible @PR @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialityPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC2: Form C8 link is present with the correct href and opens in a new tab
  test('Form C8 link is present and correctly configured @PR', async ({
    confidentialityPage,
  }) => {
    await confidentialityPage.verifyFormC8Link();
  });
 
  // AC3: Redaction instructions are shown
  test('Redaction instructions are displayed @PR', async ({
    confidentialityPage,
  }) => {
    await confidentialityPage.verifyRedactionInstructions();
  });
 
  // AC4: Court staff disclaimer is shown
  test('Court staff disclaimer is displayed @PR', async ({
    confidentialityPage,
  }) => {
    await confidentialityPage.verifyCourtStaffDisclaimer();
  });
 
  // AC5: Confidential information examples and do-not-redact guidance are shown
  test('Confidential information examples are displayed @PR', async ({
    confidentialityPage,
  }) => {
    await confidentialityPage.verifyConfidentialInformationExamples();
  });
 
  // AC6: Warning message about documents being placed on the court record is shown
  test('Court record warning message is displayed @PR', async ({
    confidentialityPage,
  }) => {
    await confidentialityPage.verifyCourtRecordWarning();
  });
 
  // AC7: Continue navigates to next upload step
  test('Continue button navigates to upload step @PR @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialityPageContent();
    await confidentialityPage.clickContinueAndExpectUploadStep();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  // AC8: Cancel returns to dashboard
  test('Cancel button returns to dashboard @PR @a11y', async ({
    dashboardPage,
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialityPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
 
    await confidentialityPage.clickCancelAndExpectDashboard();
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
 
  // AC9: Getting help panel is collapsed by default and expands with correct contact details
  test('Getting help panel is closed by default and shows contact details when expanded @PR @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyContactHelpClosedByDefault();
    await confidentialityPage.verifyContactHelpContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});