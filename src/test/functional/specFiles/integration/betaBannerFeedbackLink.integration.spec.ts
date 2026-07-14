import { expect, test } from '../../../fixtures/fixtures';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';

function shouldRunHappyPathIntegrationSuite(): boolean {
  const explicitToggle = process.env.ACCESS_CODE_REAL_INTEGRATION;
  const runningEnv = (process.env.RUNNING_ENV || '').toLowerCase();
  const testUrl = (process.env.TEST_URL || '').toLowerCase();
  const isPreviewOrAatTarget =
    runningEnv === 'aat'
    || runningEnv.startsWith('pr-')
    || testUrl.includes('.preview.platform.hmcts.net')
    || testUrl.includes('.aat.platform.hmcts.net');

  if (explicitToggle === 'true') {
    return true;
  }

  if (explicitToggle === 'false') {
    // Legacy .env files often set false; do not block preview/AAT by default.
    return isPreviewOrAatTarget;
  }

  return isPreviewOrAatTarget;
}

const runIntegration = shouldRunHappyPathIntegrationSuite();

test.describe('[integration-happy-path] Beta banner feedback link across journey pages', () => {
  test.skip(
    !runIntegration,
    'Skipped outside preview/AAT by default. Set ACCESS_CODE_REAL_INTEGRATION=true to force enable on non-preview/non-AAT targets.'
  );

  test('[integration-happy-path] Beta banner feedback link uses SmartSurvey URL with current page on each journey step @a11y', async ({
    loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    fdrPage,
    documentSelectionPage,
    documentUploadPage,
    checkUploadPage,
    contestedCaseWithHearing,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);

    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await enterCaseNumberPage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
    await enterAccessCodePage.verifyAccessCodePageContent();
    await enterAccessCodePage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await dashboardPage.clickGoToDocumentUpload();
    await beforeYouStartPage.verifyBeforeYouStartPageContent();
    await beforeYouStartPage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await beforeYouStartPage.startUploadJourney();
    await confidentialityPage.verifyConfidentialityPageContent();
    await confidentialityPage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await confidentialityPage.clickContinueAndExpectFdrStep();
    await fdrPage.verifyFdrPageContent();
    await fdrPage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.verifyDocumentSelectionPageContent('/upload/fdr');
    await documentSelectionPage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await documentSelectionPage.addOtherDocumentAndContinue();
    await expect(documentUploadPage.pageHeader).toBeVisible();
    await documentUploadPage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.clickContinue();
    await checkUploadPage.verifyCheckUploadPageContent();
    await checkUploadPage.verifyBetaBannerFeedbackLinkForCurrentPage();

    await runA11yAudit(axeUtils);
  });
});