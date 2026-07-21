import { expect, test } from '../../../fixtures/fixtures';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';

if (shouldRunRealCcdIntegrationSuite()) {
  test.describe('[integration-happy-path] Beta banner feedback link across journey pages', () => {

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
}