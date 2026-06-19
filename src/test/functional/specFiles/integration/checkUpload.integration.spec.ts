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

    // error validation test
    test('[integration] Check uploaded documents requires upload selection before continuing @a11y', async ({
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

  test('[integration] Removing a document type deletes its uploaded files @a11y', async ({
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

    // Add Mortgage and Other document types
    await documentSelectionPage.addDocumentBySearchTerm('mortgage', 'Mortgage statements for family home');
    await documentSelectionPage.addDocumentBySearchTerm('other', 'Other document');
    await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();

    // Upload both documents
    await documentUploadPage.chooseFileAndUploadDocumentByTypeValue('mortgage-statements-for-family-home');
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.clickContinue();

    // Verify check upload page shows both documents
    await expect(checkUploadPage.uploadedDocumentLinks).toHaveCount(2);

    // Go back to document selection
    await checkUploadPage.clickBackAndExpectUploadDocuments();
    await documentUploadPage.clickBack();

    // Remove Mortgage document type from selection
    await documentSelectionPage.removeDocumentByLabel('Mortgage statements for family home');
    await expect(documentSelectionPage.documentList).toHaveCount(1);

    // Continue to check page - removed type and its files should be gone
    await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();
    await documentUploadPage.clickContinue();

    // Remaining selected type (Other) still has its file, so no validation error is expected
    await expect(checkUploadPage.errorSummaryTitle).toHaveCount(0);
    await expect(checkUploadPage.uploadedDocumentLinks).toHaveCount(1);
    await checkUploadPage.expectDocumentGroupVisible('Other document');
    await expect(
      checkUploadPage.page.getByRole('heading', { level: 3, name: 'Mortgage statements for family home', exact: true })
    ).toHaveCount(0);

    await runA11yAudit(axeUtils);
  });

  test('[integration] Changing document types removes uploads for removed types and keeps new Bank upload @a11y', async ({
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

    // Add Mortgage and Other document types
    await documentSelectionPage.addDocumentBySearchTerm('mortgage', 'Mortgage statements for family home');
    await documentSelectionPage.addDocumentBySearchTerm('other', 'Other document');
    await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();

    // Upload both documents
    await documentUploadPage.chooseFileAndUploadDocumentByTypeValue('mortgage-statements-for-family-home');
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.clickContinue();

    // Verify both files on check page
    await expect(checkUploadPage.uploadedDocumentLinks).toHaveCount(2);

    // Go back to document selection
    await checkUploadPage.clickBackAndExpectUploadDocuments();
    await documentUploadPage.clickBack();

    // Remove both Mortgage and Other, add Bank instead
    await documentSelectionPage.removeDocumentByLabel('Mortgage statements for family home');
    await documentSelectionPage.removeDocumentByLabel('Other document');
    await documentSelectionPage.addDocumentBySearchTerm('bank', 'Bank statements');

    // Continue to upload page
    await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();

    // Upload Bank statement
    await documentUploadPage.chooseFileAndUploadBankStatementDocx();

    // Go to check page
    await documentUploadPage.clickContinue();

    // Wait for the page to fully re-render with updated document selection
    await checkUploadPage.page.waitForLoadState('networkidle');
    await expect(checkUploadPage.pageHeader).toBeVisible();
    
    // Removed document types should not appear after the selection change is processed
    await expect(checkUploadPage.page.getByRole('heading', {
      level: 3,
      name: 'Mortgage statements for family home',
      exact: true,
    })).toHaveCount(0);
    await expect(checkUploadPage.page.getByRole('heading', {
      level: 3,
      name: 'Other document',
      exact: true,
    })).toHaveCount(0);

    await expect(checkUploadPage.uploadedDocumentLinks).toHaveCount(1);

    // Only the newly selected Bank upload should remain
    await checkUploadPage.expectDocumentGroupVisible('Bank statements');

    await runA11yAudit(axeUtils);
  });

});
