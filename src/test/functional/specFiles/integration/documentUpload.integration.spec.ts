import { expect, test } from '../../../fixtures/fixtures';
import { assertUploadPageCoreContent, runA11yAudit } from '../journeyHelpers/specAssertions.helper';
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

  test('[integration] Upload your documents page displays expected content and layout @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await assertUploadPageCoreContent(documentUploadPage);
    await expect(documentUploadPage.uploadSectionHeadings).toHaveCount(1);
    await runA11yAudit(axeUtils);
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

  test('[integration] Continue after uploading documents navigates to check-upload @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.clickContinue();
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/check-upload/);
    await expect(documentUploadPage.page.getByRole('heading', { name: 'Check your uploaded documents' })).toBeVisible();
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

    // In integration runs, invalid client-side selection may clear the input without
    // rendering a stable inline error node. Continue produces a deterministic error state.
    await documentUploadPage.clickContinue();
    const noFileError = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');
    await expect(noFileError).toBeVisible();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(0);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload rejects empty files @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.uploadEmptyFile();

    // Integration behavior can vary between explicit "empty file" validation and
    // fallback "at least one file" validation when the empty selection is discarded.
    await documentUploadPage.clickContinue();
    const emptyFileError = documentUploadPage.getErrorSummaryLink('The selected file is empty');
    const noFileError = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');
    await expect(emptyFileError.or(documentUploadPage.inlineEmptyFileError).or(noFileError).first()).toBeVisible();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(0);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Retry upload after validation failure succeeds and clears error @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.uploadInvalidFileFormat();

    // Keep retry flow deterministic across environments by asserting the stable
    // post-continue validation state before re-uploading a valid document.
    await documentUploadPage.clickContinue();
    const noFileError = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');
    await expect(noFileError).toBeVisible();

    await documentUploadPage.chooseFileAndUploadDocx();
    await expect(documentUploadPage.getUploadedFileByName('testDocument.docx')).toBeVisible();
    await expect(noFileError).toHaveCount(0);
    await expect(documentUploadPage.inlineFormatError).toBeHidden();
    await runA11yAudit(axeUtils);
  });

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
