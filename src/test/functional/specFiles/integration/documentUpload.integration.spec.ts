import { test } from '../../../fixtures/fixtures';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToFdrStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Document Upload step
 *
 * This suite verifies document upload behavior within the upload
 * journey, including content, add/remove flows, validation, navigation,
 * and progression to check upload.
 *
 * Setup:
 * - Uses authenticated `loggedInPage` fixture (real IDAM login flow)
 * - Navigates via shared helper: dashboard -> before-you-start -> confidentiality -> FDR -> document selection
 * - Moves from FDR to document selection by selecting Yes
 *
 * Runs on:
 * - Environments with working authentication/session support
 */
test.describe('[integration] Document selection page', () => {
  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
    fdrPage,
    documentSelectionPage,
    documentUploadPage,
  }) => {
    await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addOtherDocumentAndContinue();
    await documentUploadPage.verifyDocumentUploadPageContent();
  });

  test('[integration] Document upload supports adding an uploaded docx file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding an uploaded jgp file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadJpg();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding an uploaded png file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadPng();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding an uploaded pdf file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadPdf();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding an uploaded xlsx file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadXlsx();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding multiple uploaded files @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.expectUploadedFilesListContains(['testDocument.docx', 'testDocument.docx']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports removing an uploaded file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.expectUploadedFilesListContains(['testDocument.docx', 'testDocument.docx']);
    await documentUploadPage.removeUploadedFile();
    await documentUploadPage.expectUploadedFilesListContains(['testDocument.docx']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload requires at least one uploaded file before continuing @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.submitWithoutUploadsAndExpectValidationError();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload requires correct file format before continuing @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.submitWithWrongFormatAndExpectValidationError();
    await runA11yAudit(axeUtils);
  });

  // TODO: Add this test when next step is implemented
  // test('[integration] Document upload continue navigates to next step @a11y', async ({
  //   documentUploadPage,
  //   axeUtils,
  // }) => {
  //   await documentUploadPage.chooseFileAndUploadDocument();
  //   await documentUploadPage.clickContinueAndExpectNextStep();
  //   await runA11yAudit(axeUtils);
  // });

  test('[integration] Upload documents selection getting help panel shows expected contact details @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.verifyGettingHelpSection();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Upload documents back navigation returns to document type selection and retains uploaded file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.clickBackToDocumentTypeSelectionAndReturnWithContinueSelection();
    await documentUploadPage.expectUploadedFilesListContains(['testDocument.docx']);
    await runA11yAudit(axeUtils);
  });
});
