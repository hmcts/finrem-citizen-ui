import path from 'node:path';

import { Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GettingHelpPanel } from './components/gettingHelpPanel.component';

const TEST_DATA_DIR = path.join(__dirname, '../utils/test_data');

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
  readonly errorSummaryTitle: Locator;
  readonly inlineNoFilesError: Locator;
  readonly inlineFormatError: Locator;
  readonly continueButton: Locator;
  readonly helpOpeningHours: Locator;
  readonly gettingHelp: GettingHelpPanel;

  constructor(readonly page: Page) {
    super(page);
    this.gettingHelp = new GettingHelpPanel(this.page);
    this.backLink = this.page.getByRole('link', { name: 'Back', exact: true });
    this.pageHeader = this.page.getByRole('heading', { name: 'Upload your documents', exact: true });
    this.introText = this.page.getByText('Upload each of your documents in the corresponding section. You will be able to check what you have uploaded before you submit them to the court.', { exact: true });
    this.documentTypeLabel = this.page.getByText('Other document', { exact: true });
    this.instructionTitleLabel = this.page.getByText('Upload a file', { exact: true });
    this.instructionText = this.page.getByText('Files must be in jpg, png, pdf, docx or xlsx format.', { exact: true });
    this.chooseFileButton = this.page.getByRole('button', { name: /^(Choose file|Upload a file)$/ });
    this.noFileSelectedMessage = this.page.getByText('No file chosen', { exact: true });
    this.uploadFileButton = this.page.getByRole('button', { name: 'Upload file' });
    this.uploadedFileLinks = this.page.getByRole('list').locator('a.govuk-link:not([data-remove-file])');
    this.filesListHeader = this.page.getByRole('heading', { name: 'Uploaded files', exact: true });
    this.filesListDefaultMessage = this.page.getByText('No files uploaded yet.', { exact: true });
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.inlineNoFilesError = this.page.getByText('You must upload at least one file before continuing', { exact: true });
    this.inlineFormatError = this.page.getByText('Your file must be in jpg, png, pdf, docx or xlsx format', { exact: true });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.noUploadedFilesMessage = this.page.getByText('You must upload at least one file before continuing', { exact: true });
    this.helpOpeningHours = this.gettingHelp.details.getByText('Monday to Friday, 8.30am to 5pm', {
      exact: false,
    });
  }

  private termByLabel(label: string): Locator {
    return this.uploadedFileLinks.filter({ hasText: label }).first();
  }

  getErrorSummaryLink(message: string | RegExp): Locator {
    return this.page.getByRole('alert').getByRole('link', { name: message });
  }

  async chooseFileAndUploadDocument(filePath: string = SUPPORTED_UPLOAD_FILES.docx): Promise<void> {
    const labelledInput = this.page.getByLabel('Upload a file', { exact: true });

    if (await labelledInput.count()) {
      await labelledInput.setInputFiles(filePath);
    } else {
      await this.page.locator('input[type="file"]').first().setInputFiles(filePath);
    }

    await this.uploadFileButton.click();
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

  async chooseFileAndUploadXlsx(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.xlsx);
  }

  getUploadedFileByName(filename: string): Locator {
    return this.termByLabel(filename);
  }

  async removeUploadedFile(): Promise<void> {
    await this.page.getByText('Remove document').first().click();
  }

  async uploadInvalidFileFormat(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.txt);
  }

  async uploadEmptyFile(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.emptyDocx);
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBack(): Promise<void> {
    await this.backLink.click();
  }
}
