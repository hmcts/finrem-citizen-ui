import { DEFAULT_AXE_OPTIONS, test } from '../../fixtures/fixtures';


test.describe('Dashboard upload journey', () => {
  test.beforeEach(async ({ loggedInPage: _loggedInPage, dashboardPage }) => {
    // Ensure logged-in session and navigate to dashboard for each test
    await dashboardPage.navigateToDashboard();
  });

  test('Dashboard sections and upload document button visible and accessible @a11y', async ({
    dashboardPage,
    axeUtils,
  }) => {
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('Before-you-start sections and help details are visible and accessible @a11y', async ({
    dashboardPage,
    beforeYouStartPage,
    axeUtils,
  }) => {
    await dashboardPage.clickGoToDocumentUpload();

    await beforeYouStartPage.verifyBeforeYouStartPageContent();
    await beforeYouStartPage.verifyHelpAndGuidanceClosedByDefault();
    await beforeYouStartPage.verifyUnableToSendGuidance();
    await beforeYouStartPage.verifyContactHelpContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('Before-you-start supports back navigation and start-now progression @a11y', async ({
    dashboardPage,
    beforeYouStartPage,
    axeUtils,
  }) => {
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.clickGoToDocumentUpload();

    await beforeYouStartPage.verifyBeforeYouStartPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);

    await beforeYouStartPage.goBackToDashboard();
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);

    await dashboardPage.clickGoToDocumentUpload();
    await beforeYouStartPage.startUploadJourney();
  });
});