import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GETTING_HELP_OPENING_HOURS, GettingHelpPanel } from './components/gettingHelpPanel.component';

const TEST_DATA_DIR = path.join(__dirname, '../utils/test_data');

const DOCUMENT_TYPE_FORM_KEY: Record<'Other document' | 'Chronology', string> = {
  'Other document': 'other-document',
  Chronology: 'chronology',
};

const SUPPORTED_UPLOAD_FILES = {
  jpg: path.join(TEST_DATA_DIR, 'testDocument.jpg'),
  png: path.join(TEST_DATA_DIR, 'testDocument.png'),
  pdf: path.join(TEST_DATA_DIR, 'testDocument.pdf'),
  docx: path.join(TEST_DATA_DIR, 'testDocument.docx'),
  xlsx: path.join(TEST_DATA_DIR, 'testDocument.xlsx'),
  txt: path.join(TEST_DATA_DIR, 'testDocument.txt'),
  emptyDocx: path.join(TEST_DATA_DIR, 'testDocument-empty.docx'),
} as const;

export type SupportedUploadFileType = keyof typeof SUPPORTED_UPLOAD_FILES;

export class DocumentUploadPage extends BasePage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly introText: Locator;
  readonly instructionText: Locator;
  readonly chooseFileButton: Locator;
  readonly noFileSelectedMessage: Locator;
  readonly uploadFileButton: Locator;
  readonly filesListHeader: Locator;
  readonly filesListDefaultMessage: Locator;
  readonly uploadedFileLinks: Locator;
  readonly noUploadedFilesMessage: Locator;
  readonly documentTypeLabel: Locator;
  readonly instructionTitleLabel: Locator;
  readonly uploadSectionHeadings: Locator;
  readonly errorSummaryTitle: Locator;
  readonly inlineNoFilesError: Locator;
  readonly inlineFormatError: Locator;
  readonly inlineTooLargeError: Locator;
  readonly inlineEmptyFileError: Locator;
  readonly inlineUploadFailedError: Locator;
  readonly inlinePasswordProtectedError: Locator;
  readonly continueButton: Locator;
  readonly helpOpeningHours: Locator;
  readonly gettingHelp: GettingHelpPanel;

  constructor(readonly page: Page) {
    super(page);
    this.gettingHelp = new GettingHelpPanel(this.page);
    this.backLink = this.page.getByRole('link', { name: 'Back', exact: true });
    this.pageHeader = this.page.getByRole('heading', { name: /Upload your documents/i });
    this.introText = this.page.getByText('Upload each of your documents in the corresponding section. You will be able to check what you have uploaded before you submit them to the court.', { exact: true });
    this.documentTypeLabel = this.page.getByText('Other document', { exact: true });
    this.instructionTitleLabel = this.page.getByText('Upload a file', { exact: true });
    this.instructionText = this.page.getByText('Files must be in jpg, png, pdf, docx or xlsx format.', { exact: true });
    this.uploadSectionHeadings = this.page.locator('main .govuk-grid-column-two-thirds h2.govuk-heading-m');
    this.chooseFileButton = this.page.getByRole('button', { name: /^(Choose file|Upload a file)$/ });
    this.noFileSelectedMessage = this.page.getByText('No file chosen', { exact: true });
    this.uploadFileButton = this.page.getByRole('button', { name: 'Upload file' });
    this.uploadedFileLinks = this.page.getByRole('list').locator('a.govuk-link:not([data-remove-file])');
    this.filesListHeader = this.page.getByRole('heading', { name: 'Uploaded files', exact: true });
    this.filesListDefaultMessage = this.page.getByText('No files uploaded yet.', { exact: true });
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.inlineNoFilesError = this.page.getByText('You must upload at least one file before continuing', { exact: true });
    this.inlineFormatError = this.page.locator('p.govuk-error-message').filter({
      hasText: /Your file must be in jpg, png, pdf, docx,? or xlsx format/i,
    });
    this.inlineTooLargeError = this.page.locator('p.govuk-error-message').filter({
      hasText: 'Your file must be smaller than 100MB',
    });
    this.inlineEmptyFileError = this.page.locator('p.govuk-error-message').filter({
      hasText: 'The selected file is empty',
    });
    this.inlineUploadFailedError = this.page.locator('p.govuk-error-message').filter({
      hasText: 'The selected file could not be uploaded - try again',
    });
    this.inlinePasswordProtectedError = this.page.locator('p.govuk-error-message').filter({
      hasText: 'The selected file is password protected',
    });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.noUploadedFilesMessage = this.page.getByText('You must upload at least one file before continuing', { exact: true });
    this.helpOpeningHours = this.gettingHelp.details.getByText(GETTING_HELP_OPENING_HOURS, {
      exact: false,
    });
  }

  private termByLabel(label: string): Locator {
    return this.uploadedFileLinks.filter({ hasText: label }).first();
  }

  getErrorSummaryLink(message: string | RegExp): Locator {
    return this.page.getByRole('alert').getByRole('link', { name: message });
  }

  async chooseFileAndUploadDocument(
    filePath: string = SUPPORTED_UPLOAD_FILES.docx,
    documentType: 'Other document' | 'Chronology' = 'Other document',
    expectUploadSuccess = true,
  ): Promise<void> {
    const beforeCount = await this.uploadedFileLinks.count();

    const formKey = DOCUMENT_TYPE_FORM_KEY[documentType];
    const uploadForm = this.page.locator(`[data-upload-form="${formKey}"]`);
    const fileInput = uploadForm.locator('input[type="file"]');
    const uploadButton = uploadForm.getByRole('button', { name: `Upload file for ${documentType}`, exact: true });

    await fileInput.setInputFiles(filePath);

    const uploadResponsePromise = this.page.waitForResponse(
      response => response.request().method() === 'POST' && response.url().includes('/documents/upload'),
      { timeout: 20_000 }
    );

    await Promise.all([
      uploadResponsePromise,
      uploadButton.click(),
    ]);

    if (!expectUploadSuccess) {
      await this.page.waitForURL(/\/upload\/upload-documents/, { timeout: 15_000 });
      await this.page.waitForLoadState('domcontentloaded');
    }

    if (expectUploadSuccess) {
      await expect(this.uploadedFileLinks).toHaveCount(beforeCount + 1, { timeout: 30_000 });
      await expect(this.inlineUploadFailedError).toHaveCount(0);
    } else {
      await expect(this.uploadedFileLinks).toHaveCount(beforeCount);
    }
  }

  async chooseFileAndUploadDocumentByTypeValue(
    documentTypeValue: string,
    filePath: string = SUPPORTED_UPLOAD_FILES.docx,
    expectUploadSuccess = true,
  ): Promise<void> {
    const beforeCount = await this.uploadedFileLinks.count();

    const uploadForm = this.page.locator(`[data-upload-form="${documentTypeValue}"]`);
    const fileInput = uploadForm.locator('input[type="file"]');
    const uploadButton = uploadForm.getByRole('button', { name: /Upload file for/i });

    await fileInput.setInputFiles(filePath);

    const uploadResponsePromise = this.page.waitForResponse(
      response => response.request().method() === 'POST' && response.url().includes('/documents/upload'),
      { timeout: 20_000 }
    );

    await Promise.all([
      uploadResponsePromise,
      uploadButton.click(),
    ]);

    if (!expectUploadSuccess) {
      await this.page.waitForURL(/\/upload\/upload-documents/, { timeout: 15_000 });
      await this.page.waitForLoadState('domcontentloaded');
    }

    if (expectUploadSuccess) {
      await expect(this.uploadedFileLinks).toHaveCount(beforeCount + 1, { timeout: 30_000 });
      await expect(this.inlineUploadFailedError).toHaveCount(0);
    } else {
      await expect(this.uploadedFileLinks).toHaveCount(beforeCount);
    }
  }

  async chooseFileAndUploadJpg(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.jpg);
  }

  async chooseFileAndUploadPng(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.png);
  }

  async chooseFileAndUploadPdf(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.pdf);
  }

  async chooseFileAndUploadDocx(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.docx);
  }

  async chooseFileAndUploadChronologyDocx(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.docx, 'Chronology');
  }

  async chooseFileAndUploadXlsx(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.xlsx);
  }

  async chooseFileAndUploadBankStatementDocx(): Promise<void> {
    await this.chooseFileAndUploadDocumentByTypeValue('bank-statements', SUPPORTED_UPLOAD_FILES.docx);
  }

  async chooseFileAndUploadPayslipDocx(): Promise<void> {
    await this.chooseFileAndUploadDocumentByTypeValue('payslips', SUPPORTED_UPLOAD_FILES.docx);
  }

  getUploadedFileByName(filename: string): Locator {
    return this.termByLabel(filename);
  }

  async removeUploadedFile(): Promise<void> {
    const beforeCount = await this.uploadedFileLinks.count();
    const removeLink = this.page.locator('[data-remove-file]').first();
    const fileId = await removeLink.getAttribute('data-remove-file');

    if (!fileId) {
      throw new Error('Remove file link does not contain a file ID');
    }

    const removePath = `/documents/remove/${fileId}`;

    const tryRemoveViaUi = async (): Promise<boolean> => {
      try {
        const currentRemoveLink = this.page.locator('[data-remove-file]').first();
        await expect(currentRemoveLink).toBeVisible({ timeout: 5_000 });
        await currentRemoveLink.click();
        await expect(this.uploadedFileLinks).toHaveCount(beforeCount - 1, { timeout: 10_000 });
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`UI remove attempt failed for ${removePath}`, error);
        return false;
      }
    };

    // First attempt can race JS listener attachment in integration; retry once before fallback.
    if (await tryRemoveViaUi()) {
      return;
    }

    await this.page.waitForLoadState('domcontentloaded');
    if (await tryRemoveViaUi()) {
      return;
    }

    throw new Error(`Unable to remove uploaded file via UI after retry for ${removePath}`);
  }

  async uploadInvalidFileFormat(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.txt, 'Other document', false);
  }

  async uploadEmptyFile(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.emptyDocx, 'Other document', false);
  }

  async chooseLargeFileAndUpload(sizeBytes = 101 * 1024 * 1024): Promise<void> {
    const tempFilePath = path.join(
      os.tmpdir(),
      `finrem-large-upload-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`
    );

    await fs.writeFile(tempFilePath, Buffer.from('%PDF-1.7\n'));
    await fs.truncate(tempFilePath, sizeBytes);

    try {
      await this.chooseFileAndUploadDocument(tempFilePath, 'Other document', false);
    } finally {
      await fs.unlink(tempFilePath).catch(() => {
        // Ignore cleanup errors for temp files.
      });
    }
  }

  async uploadPasswordProtectedPdf(): Promise<void> {
    const tempFilePath = path.join(
      os.tmpdir(),
      `finrem-password-protected-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`
    );

    // Include the /Encrypt marker expected by server-side password-protection validation.
    await fs.writeFile(tempFilePath, Buffer.from('%PDF-1.7\n1 0 obj\n<< /Encrypt 2 0 R >>\nendobj'));

    try {
      await this.chooseFileAndUploadDocument(tempFilePath, 'Other document', false);
    } finally {
      await fs.unlink(tempFilePath).catch(() => {
        // Ignore cleanup errors for temp files.
      });
    }
  }

  async uploadPasswordProtectedXlsx(): Promise<void> {
    const tempFilePath = path.join(
      os.tmpdir(),
      `finrem-password-protected-${Date.now()}-${Math.random().toString(16).slice(2)}.xlsx`
    );

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);

    const centralDirectoryHeader = Buffer.alloc(46);
    centralDirectoryHeader.writeUInt32LE(0x02014b50, 0);
    // General purpose bit flag with encryption bit set.
    centralDirectoryHeader.writeUInt16LE(1, 8);

    const endOfCentralDirectory = Buffer.alloc(22);
    endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
    endOfCentralDirectory.writeUInt16LE(1, 8);
    endOfCentralDirectory.writeUInt16LE(1, 10);
    endOfCentralDirectory.writeUInt32LE(centralDirectoryHeader.length, 12);
    endOfCentralDirectory.writeUInt32LE(localHeader.length, 16);

    const encryptedXlsxBuffer = Buffer.concat([localHeader, centralDirectoryHeader, endOfCentralDirectory]);
    await fs.writeFile(tempFilePath, encryptedXlsxBuffer);

    try {
      await this.chooseFileAndUploadDocument(tempFilePath, 'Other document', false);
    } finally {
      await fs.unlink(tempFilePath).catch(() => {
        // Ignore cleanup errors for temp files.
      });
    }
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  }

  async clickBack(): Promise<void> {
    await this.backLink.click();
  }
}
