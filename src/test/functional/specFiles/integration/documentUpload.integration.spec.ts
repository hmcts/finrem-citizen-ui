import { expect, test } from '../../../fixtures/fixtures';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToFdrStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Document Upload step
 *
 * This suite verifies document upload behavior within the upload
 * journey, including adding/removing files by type, validation,
 * accessibility, getting help, and back navigation.
 *
 * Setup:
 * - Uses authenticated `loggedInPage` fixture (real IDAM login flow)
 * - Navigates via shared helper: dashboard -> before-you-start -> confidentiality -> FDR -> document selection
 * - Selects "Other document" on document selection page and continues to upload page
 *
 * Runs on:
 * - Environments with working authentication/session support
 */
test.describe('[integration] Document upload page', () => {
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
    // Verify page content
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/upload-documents/);
    await expect(documentUploadPage.pageHeader).toBeVisible();
  });

  test('[integration] Document upload supports adding an uploaded docx file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await expect(documentUploadPage.getUploadedFileByName('testDocument.docx')).toBeVisible();
    await expect(documentUploadPage.filesListDefaultMessage).toBeHidden();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding an uploaded jgp file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadJpg();
    await expect(documentUploadPage.getUploadedFileByName('testDocument.jpg')).toBeVisible();
    await expect(documentUploadPage.filesListDefaultMessage).toBeHidden();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding an uploaded png file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadPng();
    await expect(documentUploadPage.getUploadedFileByName('testDocument.png')).toBeVisible();
    await expect(documentUploadPage.filesListDefaultMessage).toBeHidden();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding an uploaded pdf file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadPdf();
    await expect(documentUploadPage.getUploadedFileByName('testDocument.pdf')).toBeVisible();
    await expect(documentUploadPage.filesListDefaultMessage).toBeHidden();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding an uploaded xlsx file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadXlsx();
    await expect(documentUploadPage.getUploadedFileByName('testDocument.xlsx')).toBeVisible();
    await expect(documentUploadPage.filesListDefaultMessage).toBeHidden();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports adding multiple uploaded files @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.chooseFileAndUploadDocx();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(2);
    await expect(documentUploadPage.getUploadedFileByName('testDocument.docx')).toBeVisible();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports removing an uploaded file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.chooseFileAndUploadDocx();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(2);
    await documentUploadPage.removeUploadedFile();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(1);
    await expect(documentUploadPage.getUploadedFileByName('testDocument.docx')).toBeVisible();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload displays rename instruction and renames file for supported document types (Chronology) @a11y', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
    fdrPage,
    documentSelectionPage,
    documentUploadPage,
    axeUtils,
  }) => {
    // Navigate and select a renaming document type (Chronology)
    await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addChronologyAndContinue();
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/upload-documents/);
    await expect(documentUploadPage.pageHeader).toBeVisible();

    // Verify rename instruction text appears for renaming document types
    const renameInstruction = documentUploadPage.page.getByText(/automatically be renamed to.*-DD-MM-YY/);
    await expect(renameInstruction).toBeVisible();

    // Upload file into Chronology section
    await documentUploadPage.chooseFileAndUploadChronologyDocx();

    // Verify file appears with renamed format
    const renamedFilePattern = /.*-Chronology-\d{2}-\d{2}-\d{4}\..+/;
    const renamedFile = documentUploadPage.page.locator('a.govuk-link:not([data-remove-file])').filter({
      hasText: renamedFilePattern,
    });
    await expect(renamedFile).toBeVisible();

    // Verify file is in uploaded files list (both renaming and non-renaming docs)
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(1);

    // Verify remove button is visible
    await expect(documentUploadPage.page.getByText('Remove document')).toBeVisible();

    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload requires at least one uploaded file before continuing @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.clickContinue();
    await expect(documentUploadPage.errorSummaryTitle).toBeVisible();
    const errorLink = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');
    await expect(errorLink).toBeVisible();
    await expect(documentUploadPage.inlineNoFilesError).toBeVisible();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(0);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload requires correct file format before continuing @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.uploadInvalidFileFormat();
    await documentUploadPage.clickContinue();
    await expect(documentUploadPage.errorSummaryTitle).toBeVisible();
    // Invalid file is rejected on upload, so no files in list triggers "must upload file" error
    const errorLink = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');
    await expect(errorLink).toBeVisible();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(0);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload rejects empty files @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.uploadEmptyFile();
    await documentUploadPage.clickContinue();
    await expect(documentUploadPage.errorSummaryTitle).toBeVisible();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(0);
    await runA11yAudit(axeUtils);
  });

  // TODO: Add this test when next step is implemented
  // test('[integration] Document upload continue navigates to next step @a11y', async ({
  //   documentUploadPage,
  //   axeUtils,
  // }) => {
  //   await documentUploadPage.chooseFileAndUploadDocument();
  //   await documentUploadPage.clickContinue();
  //   await expect(documentUploadPage.page).toHaveURL(/.../);
  //   await runA11yAudit(axeUtils);
  // });

  test('[integration] Upload documents selection getting help panel shows expected contact details @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.gettingHelp.verifySection({
      expectedEmail: 'FRCexample@justice.gov.uk',
      openingHoursLocator: documentUploadPage.helpOpeningHours,
      callChargesHref: 'https://www.gov.uk/call-charges',
    });
    await runA11yAudit(axeUtils);
  });

  test('[integration] Upload documents back navigation returns to document type selection and retains uploaded file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.clickBack();
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/document-type-selection/);
    await documentUploadPage.page.getByRole('button', { name: 'Continue' }).click();
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/upload-documents/);
    await expect(documentUploadPage.getUploadedFileByName('testDocument.docx')).toBeVisible();
    await runA11yAudit(axeUtils);
  });

});
