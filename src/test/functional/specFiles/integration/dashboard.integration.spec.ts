import { test } from '../../../fixtures/fixtures';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToDashboardStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Dashboard Upload Journey
 * 
 * These tests verify dashboard page layout, navigation, and upload journey flow.
 * They rely on authenticated sessions via the standard loggedInPage fixture.
 * 
 * Runs on: Environments with working authentication/session support
 */

if (shouldRunRealCcdIntegrationSuite()) {
  test.describe('[integration] Dashboard upload journey', () => {
  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    dashboardPage,
    basePage,
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);

    // Ensure logged-in session and navigate to dashboard for each test
    await navigateToDashboardStep(dashboardPage, basePage);
  });

  test('[integration] Dashboard sections and upload document button visible and accessible @a11y', async ({
    dashboardPage,
    axeUtils,
  }) => {
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.verifyDivorceAccountHeadingHidden();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Dashboard getting help panel shows expected support details when expanded @a11y', async ({
    dashboardPage,
    axeUtils,
  }) => {
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.verifyGettingHelpSection();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Dashboard divorce-account inset is conditionally rendered and valid when present @a11y', async ({
    dashboardPage,
    axeUtils,
  }) => {
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.verifyDivorceAccountInsetIfVisible();
    await runA11yAudit(axeUtils);
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
    await runA11yAudit(axeUtils);
  });

  test('[integration] Before-you-start supports back navigation and start-now progression @a11y', async ({
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    axeUtils,
  }) => {
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.clickGoToDocumentUpload();

    await beforeYouStartPage.verifyBeforeYouStartPageContent();

    await beforeYouStartPage.goBackToDashboard();
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.verifyDivorceAccountHeadingHidden();

    await dashboardPage.clickGoToDocumentUpload();
    await beforeYouStartPage.startUploadJourney();
    await confidentialityPage.verifyConfidentialityPageContent();
    await runA11yAudit(axeUtils);
  });
  });
}
