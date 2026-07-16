import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GETTING_HELP_OPENING_HOURS, GettingHelpPanel } from './components/gettingHelpPanel.component';

const URL_PATTERNS = {
  DOCUMENT_SELECTION: /\/upload\/document-type-selection/,
  FDR: /\/upload\/fdr/,
  UPLOAD_DOCUMENTS: /\/upload\/upload-documents/,
};

export class DocumentSelectionPage extends BasePage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly introText: Locator;
  readonly instructionText: Locator;
  readonly documentTypeLabel: Locator;
  readonly documentTypeInput: Locator;
  readonly addDocumentButton: Locator;
  readonly documentsHeading: Locator;
  readonly noDocumentsMessage: Locator;
  readonly documentList: Locator;
  readonly errorSummaryTitle: Locator;
  readonly errorSummaryLink: Locator;
  readonly inlineErrorMessage: Locator;
  readonly uploadDocumentsHeading: Locator;
  readonly helpOpeningHours: Locator;
  readonly continueButton: Locator;
  readonly gettingHelp: GettingHelpPanel;

  constructor(readonly page: Page) {
    super(page);
    this.gettingHelp = new GettingHelpPanel(this.page);
    this.backLink = this.page.getByRole('link', { name: 'Back', exact: true });
    this.pageHeader = this.page.getByRole('heading', {
      name: 'Tell us which documents you want to upload',
    });
    this.introText = this.page.getByText(
      "Start typing the document you want to upload (for example, 'payslips') in the box below. You will then be able to choose your document.",
      { exact: true }
    );
    this.instructionText = this.page.getByText(
      "When you have chosen the document you want to upload, select 'Add document'. You can add more than one document to upload.",
      { exact: true }
    );
    this.documentTypeLabel = this.page.getByText('What do you want to upload?', { exact: true });
    this.documentTypeInput = this.page.getByLabel('What do you want to upload?');
    this.addDocumentButton = this.page.getByRole('button', { name: 'Add document' });
    this.documentsHeading = this.page.getByRole('heading', { name: 'Documents', exact: true });
    this.noDocumentsMessage = this.page.getByText('No documents added yet.', { exact: true });
    this.documentList = this.page.locator('[data-document-types-list]').getByRole('term');
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.errorSummaryLink = this.page
      .getByRole('alert')
      .getByRole('link', { name: 'You must select what you want to upload' });
    this.inlineErrorMessage = this.page.getByText('Error: You must select what you want to upload', {
      exact: true,
    });
    this.uploadDocumentsHeading = this.page.getByRole('heading', { name: 'Upload your documents' });
    this.helpOpeningHours = this.gettingHelp.details.getByText(GETTING_HELP_OPENING_HOURS, {
      exact: false,
    });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
  }

  async verifyDocumentSelectionPageContent(expectedBackLink: string = '/upload/check-upload'): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
    await this.verifyGlobalHeaderAndFooter();

    await this.expectVisible([
      this.serviceNav,
      this.navigationLink,
      this.signOutBtn,
      this.backLink,
      this.pageHeader,
      this.introText,
      this.instructionText,
      this.documentTypeLabel,
      this.documentTypeInput,
      this.addDocumentButton,
      this.documentsHeading,
      this.continueButton,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);

    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: expectedBackLink },
    ]);
  }

  async addDocumentBySearchTerm(searchTerm: string, expectedDocumentLabel: string): Promise<void> {
    // Ensure form is ready after any prior operations (remove, page transitions, etc.)
    await this.page.waitForLoadState('networkidle');
    await expect(this.documentTypeInput).toBeEnabled();

    await this.documentTypeInput.fill('');
    const autocompleteResponsePromise = this.page.waitForResponse(response => {
      return response.url().includes('/autocomplete')
        && response.url().includes(`q=${encodeURIComponent(searchTerm)}`)
        && response.ok();
    });
    await this.documentTypeInput.pressSequentially(searchTerm);
    await autocompleteResponsePromise;

    const suggestion = this.page.getByRole('option', { name: expectedDocumentLabel });
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    await expect(this.documentTypeInput).toHaveValue(expectedDocumentLabel);
    await this.documentsHeading.click();

    await Promise.all([
      this.page.waitForResponse(response =>
        response.url().includes('/upload/document-type-selection') &&
        response.request().method() === 'POST' &&
        response.ok()
      ),
      this.addDocumentButton.click(),
    ]);

    await expect(this.termByLabel(expectedDocumentLabel)).toBeVisible({ timeout: 15_000 });
    await expect(this.noDocumentsMessage).toBeHidden();
  }

  async addChronologyAndContinue(): Promise<void> {
    await this.addDocumentBySearchTerm('chronology', 'Chronology');
    await this.clickContinueAndExpectUploadDocumentsStep();
  }

  async addOtherDocumentAndContinue(): Promise<void> {
    const otherDocumentLabel = 'Other document';
    const autocompleteResponsePromise = this.page.waitForResponse(response => {
      return response.url().includes('/autocomplete')
        && response.url().includes('q=other%20document')
        && response.ok();
    });
    await this.documentTypeInput.fill('other document');
    await autocompleteResponsePromise;

    const suggestion = this.page.getByRole('option', { name: otherDocumentLabel });
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    await this.addDocumentButton.click();

    await expect(this.termByLabel(otherDocumentLabel)).toBeVisible();
    await expect(this.noDocumentsMessage).toBeHidden();

    await this.continueButton.click();
  }

  async expectDocumentsListContains(labels: string[]): Promise<void> {
    await expect(this.documentList).toHaveCount(labels.length);

    for (const label of labels) {
      await expect(this.termByLabel(label)).toBeVisible();
    }
  }

  async removeDocumentByLabel(label: string): Promise<void> {
    const documentTerm = this.termByLabel(label);

    await this.page
      .locator('[data-document-types-list]')
      .getByRole('link', { name: `Remove ${label}` })
      .click();

    await expect(documentTerm).toHaveCount(0);
  }

  async submitWithoutDocumentsAndExpectValidationError(): Promise<void> {
    await this.continueButton.click();

    await this.expectVisible([this.errorSummaryTitle, this.errorSummaryLink, this.inlineErrorMessage]);
    await expect(this.documentList).toHaveCount(0);
    await expect(this.noDocumentsMessage).toBeVisible();
  }

  async clickContinueAndExpectUploadDocumentsStep(): Promise<void> {
    await this.continueButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.UPLOAD_DOCUMENTS);
    await expect(this.uploadDocumentsHeading).toBeVisible();
  }

  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection({
      openingHoursLocator: this.helpOpeningHours,
    });
  }

  private termByLabel(label: string): Locator {
    return this.page.locator('[data-document-types-list]').getByRole('term').filter({ hasText: label });
  }

  async clickBackAndExpectFdr(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.FDR);
  }

  async clickBackToFdrAndReturnWithYesSelection(): Promise<void> {
    await this.clickBackAndExpectFdr();
    await this.page.getByLabel('Yes').check();
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_SELECTION);
  }
}
