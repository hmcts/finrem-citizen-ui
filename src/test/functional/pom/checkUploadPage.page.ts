import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GETTING_HELP_OPENING_HOURS, GettingHelpPanel } from './components/gettingHelpPanel.component';

const URL_PATTERNS = {
  CHECK_UPLOAD: /\/upload\/check-upload/,
  DOCUMENT_TYPE_SELECTION: /\/upload\/document-type-selection/,
  SEND_TO_OTHER_PARTY: /\/upload\/send-to-other-party/,
  UPLOAD_DOCUMENTS: /\/upload\/upload-documents/,
};

const CHECK_UPLOAD_EMAIL = 'FRCexample@justice.gov.uk';

export class CheckUploadPage extends BasePage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly makeSureText: Locator;
  readonly guidanceBullets: Locator;
  readonly cannotDeleteWarning: Locator;
  readonly uploadMoreQuestion: Locator;
  readonly yesRadio: Locator;
  readonly noRadio: Locator;
  readonly continueButton: Locator;
  readonly documentGroupHeadings: Locator;
  readonly uploadedDocumentLinks: Locator;
  readonly combineInformation: Locator;
  readonly combinedDocumentName: Locator;
  readonly errorSummaryTitle: Locator;
  readonly uploadMoreErrorSummaryLink: Locator;
  readonly uploadMoreInlineError: Locator;
  readonly helpOpeningHours: Locator;
  readonly gettingHelp: GettingHelpPanel;
  readonly sendToOtherPartyHeading: Locator;

  constructor(readonly page: Page) {
    super(page);
    this.gettingHelp = new GettingHelpPanel(this.page);
    this.backLink = this.page.getByRole('link', { name: 'Back', exact: true });
    this.pageHeader = this.page.getByRole('heading', { name: 'Check your uploaded documents', exact: true });
    this.makeSureText = this.page.getByText('Make sure you have:', { exact: true });
    this.guidanceBullets = this.page.getByRole('main').getByRole('list').filter({
      hasText: 'uploaded the correct documents',
    });
    this.cannotDeleteWarning = this.page.getByText(
      'You should carefully check all of the documents you want to upload. You will not be able to delete any documents once you submit. If you need to remove or replace a document now, go back to the previous page.',
      { exact: true }
    );
    this.uploadMoreQuestion = this.page.getByText('Do you want to upload any other documents?', { exact: true });
    this.yesRadio = this.page.getByRole('radio', { name: 'Yes', exact: true });
    this.noRadio = this.page.getByRole('radio', { name: 'No', exact: true });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.documentGroupHeadings = this.page.getByRole('main').getByRole('heading', { level: 3 });
    this.uploadedDocumentLinks = this.page.getByRole('main').locator('a[href^="/documents/"][href$="/download"]');
    this.combineInformation = this.page.getByText('These documents will be combined into one document called', {
      exact: false,
    });
    this.combinedDocumentName = this.combineInformation.locator('strong').filter({
      hasText: /-DD-MM-YYYY$/,
    });
    this.errorSummaryTitle = this.page.getByRole('heading', { name: 'There is a problem' });
    this.uploadMoreErrorSummaryLink = this.page
      .getByRole('alert')
      .getByRole('link', { name: 'Select yes if you want to upload any other documents' });
    this.uploadMoreInlineError = this.page.getByText(
      'Error: Select yes if you want to upload any other documents',
      { exact: true }
    );
    this.helpOpeningHours = this.gettingHelp.details.getByText(GETTING_HELP_OPENING_HOURS, {
      exact: false,
    });
    this.sendToOtherPartyHeading = this.page.getByRole('heading', {
      name: 'You need to send these documents to the other party',
      exact: true,
    });
  }

  async verifyCheckUploadPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.CHECK_UPLOAD);
    await this.verifyGlobalHeaderAndFooter();

    await this.expectVisible([
      this.serviceNav,
      this.navigationLink,
      this.signOutBtn,
      this.backLink,
      this.pageHeader,
      this.makeSureText,
      this.guidanceBullets,
      this.cannotDeleteWarning,
      this.uploadMoreQuestion,
      this.yesRadio,
      this.noRadio,
      this.continueButton,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);

    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: '/upload/upload-documents' },
    ]);
  }

  async expectDocumentGroupVisible(groupLabel: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 3, name: groupLabel, exact: true })).toBeVisible();
  }

  async expectDocumentLinkVisible(filename: string): Promise<void> {
    const link = this.page.getByRole('link', { name: filename, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }

  async selectUploadMore(choice: 'yes' | 'no'): Promise<void> {
    if (choice === 'yes') {
      await this.yesRadio.check();
      return;
    }
    await this.noRadio.check();
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async submitWithoutSelectionAndExpectValidationError(): Promise<void> {
    await this.clickContinue();
    await this.expectVisible([this.errorSummaryTitle, this.uploadMoreErrorSummaryLink, this.uploadMoreInlineError]);
  }

  async selectYesAndContinue(): Promise<void> {
    await this.selectUploadMore('yes');
    await this.clickContinue();
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_TYPE_SELECTION);
  }

  async selectNoAndContinue(): Promise<void> {
    await this.selectUploadMore('no');
    await this.clickContinue();
    await expect(this.page).toHaveURL(URL_PATTERNS.SEND_TO_OTHER_PARTY);
  }

  async expectSendToOtherPartyHeadingVisible(): Promise<void> {
    await expect(this.sendToOtherPartyHeading).toBeVisible();
  }

  async clickBackAndExpectUploadDocuments(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.UPLOAD_DOCUMENTS);
  }

  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection({
      expectedEmail: CHECK_UPLOAD_EMAIL,
      openingHoursLocator: this.helpOpeningHours,
    });
  }
}
