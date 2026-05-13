import { DEFAULT_AXE_OPTIONS, test } from '../../../fixtures/fixtures';
import { navigateToDashboardStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Dashboard Upload Journey
 * 
 * These tests verify dashboard page layout, navigation, and upload journey flow.
 * They rely on authenticated sessions via the standard loggedInPage fixture.
 * 
 * Runs on: Environments with working authentication/session support
 */

test.describe('[integration] Dashboard upload journey', () => {
  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    assertionHelpers: _assertionHelpers,
    basePage,
  }) => {
    // Ensure logged-in session and navigate to dashboard for each test
    await navigateToDashboardStep(dashboardPage, basePage);
  });

  test('[integration] Dashboard sections and upload document button visible and accessible @a11y', async ({
    dashboardPage,
    axeUtils,
  }) => {
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.verifyDivorceAccountHeadingHidden();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] Before-you-start sections and help details are visible and accessible @a11y', async ({
    dashboardPage,
    beforeYouStartPage,
    axeUtils,
  }) => {
    await dashboardPage.clickGoToDocumentUpload();

    await beforeYouStartPage.verifyBeforeYouStartPageContent();
    await beforeYouStartPage.verifyHelpAndGuidanceClosedByDefault();
    await beforeYouStartPage.verifyUnableToSendGuidance();
    await beforeYouStartPage.verifyGettingHelpSection();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] Before-you-start supports back navigation and start-now progression @a11y', async ({
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
    await dashboardPage.verifyDivorceAccountHeadingHidden();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);

    await dashboardPage.clickGoToDocumentUpload();
    await beforeYouStartPage.startUploadJourney();
  });
});
