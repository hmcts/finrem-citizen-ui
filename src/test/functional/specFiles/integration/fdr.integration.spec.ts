import { test } from '../../../fixtures/fixtures';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToFdrStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Financial Dispute Resolution (FDR) step
 *
 * FDR = Financial Dispute Resolution. This suite verifies the real upload
 * journey behavior for the FDR question page, including content, validation,
 * navigation, and progression to document selection.
 *
 * Setup:
 * - Uses authenticated `loggedInPage` fixture (real IDAM login flow)
 * - Navigates via shared helper: dashboard -> before-you-start -> confidentiality -> FDR
 *
 * Runs on:
 * - Environments with working authentication/session support
 */
test.describe('[integration] FDR page', () => {
  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
  }) => {
    await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
  });

  test('[integration] FDR page content is visible and accessible @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.verifyFdrPageContent();
    await runA11yAudit(axeUtils);
  });

  test('[integration] FDR requires hearing selection before continuing @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.submitWithoutSelectionAndExpectValidationError();
    await runA11yAudit(axeUtils);
  });

  test('[integration] FDR yes selection navigates to document selection @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.verifyDocumentSelectionPageContent();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection supports adding a document @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.expectDocumentsListContains(['Payslips']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection supports adding multiple documents @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.addDocumentBySearchTerm('bank', 'Bank statements');
    await documentSelectionPage.expectDocumentsListContains(['Payslips', 'Bank statements']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection supports removing a document @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.addDocumentBySearchTerm('bank', 'Bank statements');

    await documentSelectionPage.removeDocumentByLabel('Payslips');
    await documentSelectionPage.expectDocumentsListContains(['Bank statements']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection requires at least one document before continuing @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.submitWithoutDocumentsAndExpectValidationError();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection continue navigates to upload documents after adding documents @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection getting help panel shows expected contact details @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.verifyGettingHelpSection();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection back navigation returns to FDR and retains selected documents @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');

    await documentSelectionPage.clickBackToFdrAndReturnWithYesSelection();
    await documentSelectionPage.expectDocumentsListContains(['Payslips']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] FDR getting help panel shows expected contact details @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.verifyGettingHelpSection();
    await runA11yAudit(axeUtils);
  });
});
