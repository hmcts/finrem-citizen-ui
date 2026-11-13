import { expect, test } from '../../../fixtures/fixtures';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';

if (shouldRunRealCcdIntegrationSuite()) {
  const isLocalMockCcd = /https?:\/\/(localhost|127\.0\.0\.1):4100\b/i.test((process.env.CCD_URL || '').trim());

  test.describe('[integration-happy-path] Beta banner feedback link across journey pages', () => {
    if (isLocalMockCcd) {
      test.use({ useMockTestSupport: true });
    }

    test.beforeEach(
      async ({ loggedInPage, basePage, enterCaseNumberPage, enterAccessCodePage, contestLipOnlyPaperCase }) => {
        expectAuthenticated(loggedInPage);

        await enterCaseNumberPage.verifyCaseNumberPageContent();
        await enterCaseNumberPage.verifyBetaBannerFeedbackLinkForCurrentPage();
        await enterCaseNumberPage.submitCaseNumber(contestLipOnlyPaperCase.caseId);
        await enterAccessCodePage.verifyAccessCodePageContent();
        await enterAccessCodePage.verifyBetaBannerFeedbackLinkForCurrentPage();

        // Local mock mode reseeds at the enter-access-code stage to keep single-use codes deterministic.
        if (isLocalMockCcd) {
          await basePage.injectCaseSession(
            contestLipOnlyPaperCase.caseId,
            contestLipOnlyPaperCase.applicantAccessCode,
            contestLipOnlyPaperCase.respondentAccessCode
          );
          await enterAccessCodePage.verifyAccessCodePageContent();
          await enterAccessCodePage.verifyBetaBannerFeedbackLinkForCurrentPage();
        }
      }
    );

    test('[integration-happy-path] Beta banner feedback link uses SmartSurvey URL with current page on each journey step @a11y', async ({
      loggedInPage,
      enterAccessCodePage,
      dashboardPage,
      beforeYouStartPage,
      confidentialityPage,
      fdrPage,
      documentSelectionPage,
      documentUploadPage,
      checkUploadPage,
      contestLipOnlyPaperCase,
      axeUtils,
    }) => {
      expectAuthenticated(loggedInPage);

      await enterAccessCodePage.submitAccessCode(contestLipOnlyPaperCase.applicantAccessCode);
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
