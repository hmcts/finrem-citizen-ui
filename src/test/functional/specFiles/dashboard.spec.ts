import { DEFAULT_AXE_OPTIONS, test } from '../../fixtures/fixtures';


test.describe('Dashboard upload journey @PR', () => {
  test('Dashboard sections and upload document button visible and accessible @PR @a11y', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    axeUtils,
  }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('Before-you-start sections and help details are visible and accessible @PR @a11y', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    axeUtils,
  }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.clickGoToDocumentUpload();

    await beforeYouStartPage.verifyBeforeYouStartPageContent();
    await beforeYouStartPage.verifyHelpAndGuidanceClosedByDefault();
    await beforeYouStartPage.verifyUnableToSendGuidance();
    await beforeYouStartPage.verifyContactHelpContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('Before-you-start supports back navigation and start-now progression @PR @a11y', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    axeUtils,
  }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.clickGoToDocumentUpload();

    await beforeYouStartPage.verifyBeforeYouStartPageContent();
    await beforeYouStartPage.goBackToDashboard();
    await dashboardPage.verifyDashboardPageContent();

    await dashboardPage.clickGoToDocumentUpload();
    await beforeYouStartPage.startUploadJourney();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});