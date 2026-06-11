import path from 'path';

import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GettingHelpPanel } from './components/gettingHelpPanel.component';

const URL_PATTERNS = {
  DOCUMENT_SELECTION: /\/upload\/document-selection/,
  FDR: /\/upload\/fdr/,
  UPLOAD_DOCUMENTS: /\/upload\/upload-documents/,
};

const DOCUMENT_SELECTION_EMAIL = 'FRCexample@justice.gov.uk';
const CALL_CHARGES_LINK = 'https://www.gov.uk/call-charges';
const TEST_DATA_DIR = path.join(__dirname, '../utils/test_data');

const SUPPORTED_UPLOAD_FILES = {
  jpg: path.join(TEST_DATA_DIR, 'testDocument.jpg'),
  png: path.join(TEST_DATA_DIR, 'testDocument.png'),
  pdf: path.join(TEST_DATA_DIR, 'testDocument.pdf'),
  docx: path.join(TEST_DATA_DIR, 'testDocument.docx'),
  xlsx: path.join(TEST_DATA_DIR, 'testDocument.xlsx'),
  txt: path.join(TEST_DATA_DIR, 'testDocument.txt'),
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
  readonly errorSummaryLink: Locator;
  readonly inlineErrorMessage: Locator;
  readonly continueButton: Locator;
  readonly helpOpeningHours: Locator;
  readonly gettingHelp: GettingHelpPanel;

  constructor(readonly page: Page) {
    super(page);
    this.gettingHelp = new GettingHelpPanel(this.page);
    this.backLink = this.page.getByRole('link', { name: 'Back', exact: true });
    this.pageHeader = this.page.getByRole('heading', { name: 'Upload your documents', exact: true });
    this.introText = this.page.getByText("Upload each of your documents in the corresponding section. You will be able to check what you have uploaded before you submit them to the court.", { exact: true });
    this.documentTypeLabel = this.page.getByText('Other document', { exact: true });
    this.instructionTitleLabel = this.page.getByText('Upload a file', { exact: true });
    this.instructionText = this.page.getByText('Files must be in jpg, png, pdf, docx or xlsx format.', { exact: true });
    this.chooseFileButton = this.page.getByRole('button', { name: 'Choose file' });
    this.noFileSelectedMessage = this.page.getByText('No file chosen', { exact: true });
    this.uploadFileButton = this.page.getByRole('button', { name: 'Upload file' });
    this.uploadedFileLinks = this.page.locator('[data-uploaded-files] a.govuk-link:not([data-remove-file])');
    this.filesListHeader = this.page.getByRole('heading', { name: 'Uploaded files', exact: true });
    this.filesListDefaultMessage = this.page.getByText('No files uploaded yet.', { exact: true });
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.errorSummaryLink = this.page.getByRole('alert').getByRole('link', { name: 'Your file must be in jpg, png, pdf, docx, or xlsx format' });
    this.inlineErrorMessage = this.page.getByText('Your file must be in jpg, png, pdf, docx, or xlsx format', { exact: true });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.noUploadedFilesMessage = this.page.getByText('You must upload at least one file before continuing', { exact: true });
    this.helpOpeningHours = this.gettingHelp.details.getByText('Monday to Friday, 8.30am to 5pm', {
      exact: false,
    });
  }

  async verifyDocumentUploadPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
    await this.verifyGlobalHeaderAndFooter();

    await this.expectVisible([
      this.serviceNav,
      this.navigationLink,
      this.signOutBtn,
      this.backLink,
      this.pageHeader,
      this.introText,
      this.instructionTitleLabel,
      this.instructionText,
      this.chooseFileButton,
      this.noFileSelectedMessage,
      this.uploadFileButton,
      this.filesListHeader,
      this.filesListDefaultMessage,
      this.instructionText,
      this.documentTypeLabel,
      this.continueButton,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);

    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: '/upload/fdr' },
    ]);
  }

  private termByLabel(label: string): Locator {
    return this.page.locator('[govuk-list]').getByRole('link').filter({ hasText: label });
  }

  async chooseFileAndUploadDocument(filePath: string = SUPPORTED_UPLOAD_FILES.docx): Promise<void> {
    const filename = path.basename(filePath);
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.chooseFileButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    await this.uploadFileButton.click();

    await expect(this.termByLabel(filename)).toBeVisible();
    await expect(this.filesListDefaultMessage).toBeHidden();
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

  async expectUploadedFilesListContains(labels: string[]): Promise<void> {
    await expect(this.uploadedFileLinks).toHaveCount(labels.length);

    for (const label of labels) {
      await expect(this.termByLabel(label)).toBeVisible();
    }
  }

  async removeUploadedFile(): Promise<void> {
    await this.page.getByText('Remove document').click();
  }

  async submitWithoutUploadsAndExpectValidationError(): Promise<void> {
    await this.continueButton.click();

    await this.expectVisible([this.errorSummaryTitle, this.errorSummaryLink, this.inlineErrorMessage]);
    await expect(this.uploadedFileLinks).toHaveCount(0);
    await expect(this.noUploadedFilesMessage).toBeVisible();
  }

  async submitWithWrongFormatAndExpectValidationError(): Promise<void> {
    await this.chooseFileAndUploadDocument(SUPPORTED_UPLOAD_FILES.txt);
    await this.continueButton.click();

    await this.expectVisible([this.errorSummaryTitle, this.errorSummaryLink, this.inlineErrorMessage]);
    await expect(this.uploadedFileLinks).toHaveCount(0);
    await expect(this.noUploadedFilesMessage).toBeVisible();
  }



  // TODO: Add this method when next step is implemented
  // async clickContinueAndExpectNextStep(): Promise<void> {
  //   await this.continueButton.click();
  //   await expect(this.page).toHaveURL(URL_PATTERNS.UPLOAD_DOCUMENTS);
  //   await expect().toBeVisible();
  // }

  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection({
      expectedEmail: DOCUMENT_SELECTION_EMAIL,
      openingHoursLocator: this.helpOpeningHours,
      callChargesHref: CALL_CHARGES_LINK,
    });
  }

  async clickBackAndExpectDocumentTypeSelection(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
  }

  async clickBackToDocumentTypeSelectionAndReturnWithContinueSelection(): Promise<void> {
    await this.clickBackAndExpectDocumentTypeSelection();
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await expect(this.page).toHaveURL(URL_PATTERNS.UPLOAD_DOCUMENTS);
  }
}
