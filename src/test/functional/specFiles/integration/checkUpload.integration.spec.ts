import { expect, test } from '../../../fixtures/fixtures';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import {
  navigateToCheckUploadWithOtherDocument,
  navigateToUploadDocumentsStep,
} from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Check uploaded documents step
 *
 * This suite verifies the review step after document upload, including:
 * content/layout, grouped uploaded files, combined-document guidance,
 * branching decisions, validation, getting-help details, back navigation,
 * and accessibility assertions.
 */
test.describe('[integration] Check uploaded documents page', () => {
  test.describe('[integration] Check uploaded documents page with uploaded other document', () => {
    test.beforeEach(async ({
      loggedInPage: _loggedInPage,
      dashboardPage,
      beforeYouStartPage,
      confidentialityPage,
      basePage,
      fdrPage,
      documentSelectionPage,
      documentUploadPage,
      checkUploadPage,
    }) => {
      await navigateToCheckUploadWithOtherDocument({
        dashboardPage,
        beforeYouStartPage,
        confidentialityPage,
        basePage,
        fdrPage,
        documentSelectionPage,
        documentUploadPage,
        checkUploadPage,
      });
    });

    test('[integration] Check uploaded documents page displays expected content and layout @a11y', async ({
      checkUploadPage,
      axeUtils,
    }) => {
      await expect(checkUploadPage.documentGroupHeadings).toHaveCount(1);
      await expect(checkUploadPage.uploadedDocumentLinks).toHaveCount(1);
      await checkUploadPage.expectDocumentGroupVisible('Other document');
      await checkUploadPage.expectDocumentLinkVisible('testDocument.docx');
      await runA11yAudit(axeUtils);
    });

    test('[integration] Check uploaded documents yes selection navigates to document selection @a11y', async ({
      checkUploadPage,
      documentSelectionPage,
      axeUtils,
    }) => {
      await checkUploadPage.selectYesAndContinue();
      await documentSelectionPage.verifyDocumentSelectionPageContent();
      await runA11yAudit(axeUtils);
    });

    test('[integration] Check uploaded documents no selection navigates to send-to-other-party @a11y', async ({
      checkUploadPage,
      axeUtils,
    }) => {
      await checkUploadPage.selectNoAndContinue();
      await checkUploadPage.expectSendToOtherPartyHeadingVisible();
      await runA11yAudit(axeUtils);
    });

    test('[integration] Check uploaded documents requires upload-more selection before continuing @a11y', async ({
      checkUploadPage,
      axeUtils,
    }) => {
      await checkUploadPage.submitWithoutSelectionAndExpectValidationError();
      await runA11yAudit(axeUtils);
    });

    test('[integration] Check uploaded documents getting-help panel shows support details and links @a11y', async ({
      checkUploadPage,
      axeUtils,
    }) => {
      await checkUploadPage.verifyGettingHelpSection();
      await runA11yAudit(axeUtils);
    });

    test('[integration] Check uploaded documents back navigation returns to upload page and retains uploaded files @a11y', async ({
      checkUploadPage,
      documentUploadPage,
      axeUtils,
    }) => {
      await checkUploadPage.clickBackAndExpectUploadDocuments();
      await documentUploadPage.clickContinue();
      await checkUploadPage.verifyCheckUploadPageContent();
      await checkUploadPage.expectDocumentLinkVisible('testDocument.docx');
      await runA11yAudit(axeUtils);
    });
  });

  test('[integration] Check uploaded documents groups uploaded files by document type and shows file links @a11y', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
    fdrPage,
    documentSelectionPage,
    documentUploadPage,
    checkUploadPage,
    axeUtils,
  }) => {
    await navigateToUploadDocumentsStep(
      dashboardPage,
      beforeYouStartPage,
      confidentialityPage,
      basePage,
      fdrPage
    );

    await documentSelectionPage.addDocumentBySearchTerm('bank', 'Bank statements');
    await documentSelectionPage.addDocumentBySearchTerm('chronology', 'Chronology');
    await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();

    await documentUploadPage.chooseFileAndUploadBankStatementDocx();
    await documentUploadPage.chooseFileAndUploadChronologyDocx();
    await documentUploadPage.clickContinue();

    await checkUploadPage.expectDocumentGroupVisible('Bank statements');
    await checkUploadPage.expectDocumentGroupVisible('Chronology');
    await expect(checkUploadPage.uploadedDocumentLinks).toHaveCount(2);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Check uploaded documents shows combined document guidance and name for combined document types @a11y', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
    fdrPage,
    documentSelectionPage,
    documentUploadPage,
    checkUploadPage,
    axeUtils,
  }) => {
    await navigateToUploadDocumentsStep(
      dashboardPage,
      beforeYouStartPage,
      confidentialityPage,
      basePage,
      fdrPage
    );

    await documentSelectionPage.addDocumentBySearchTerm('bank', 'Bank statements');
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();

    await documentUploadPage.chooseFileAndUploadBankStatementDocx();
    await documentUploadPage.chooseFileAndUploadPayslipDocx();
    await documentUploadPage.clickContinue();

    await expect(checkUploadPage.combineInformation).toBeVisible();
    await expect(checkUploadPage.combinedDocumentName).toContainText('-SupportingFinancialDocuments-DD-MM-YYYY');
    await expect(checkUploadPage.uploadedDocumentLinks).toHaveCount(2);
    await runA11yAudit(axeUtils);
  });

});
