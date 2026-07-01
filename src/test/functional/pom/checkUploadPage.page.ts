import { expect, Locator, Page } from '@playwright/test';

import { isGatewayErrorContent } from '../utils/helpers/gatewayError';
import { BasePage } from './basePage.page';
import { GETTING_HELP_OPENING_HOURS, GettingHelpPanel } from './components/gettingHelpPanel.component';

const URL_PATTERNS = {
  CHECK_UPLOAD: /\/upload\/check-upload/,
  DOCUMENT_TYPE_SELECTION: /\/upload\/document-type-selection/,
  SEND_TO_OTHER_PARTY: /\/upload\/send-to-other-party/,
  UPLOAD_DOCUMENTS: /\/upload\/upload-documents/,
  CONFIRMATION: /\/upload\/confirmation/,
  DASHBOARD: /\/dashboard/,
};

const NAVIGATION_TIMEOUT_MS = 15_000;

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
  readonly sendToOtherPartyIntro: Locator;
  readonly sendToOtherPartyCourtOrderText: Locator;
  readonly sendToOtherPartyCourtWillNotServeText: Locator;
  readonly unableToSendDetailsContainer: Locator;
  readonly unableToSendDetails: Locator;
  readonly unableToSendDetailsSummary: Locator;
  readonly unableToSendDetailsParagraphOne: Locator;
  readonly unableToSendDetailsParagraphTwo: Locator;
  readonly understandCheckbox: Locator;
  readonly submitButton: Locator;
  readonly understandErrorSummaryLink: Locator;
  readonly understandInlineError: Locator;
  readonly confirmationHeading: Locator;
  readonly confirmationPanel: Locator;
  readonly confirmationWhatHappensNextHeading: Locator;
  readonly confirmationSavedToCaseText: Locator;
  readonly confirmationJudgeReviewText: Locator;
  readonly confirmationViewFromAccountLink: Locator;
  readonly confirmationReturnLaterText: Locator;
  readonly confirmationEmailText: Locator;
  readonly confirmationReturnToAccountButton: Locator;

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
    this.sendToOtherPartyIntro = this.page.getByText(
      'For full transparency between you and the other party, you need to serve these documents on them, or their solicitor if they have one.',
      { exact: true }
    );
    this.sendToOtherPartyCourtOrderText = this.page.getByText(
      'Refer to your court order for specific instructions.',
      { exact: true }
    );
    this.sendToOtherPartyCourtWillNotServeText = this.page.getByText(
      'The court will not normally serve any of the documents you have submitted on the other party for you. Uploading your documents to this online account does not count as serving the other party.',
      { exact: true }
    );
    this.unableToSendDetailsContainer = this.page
      .locator('details')
      .filter({ hasText: 'I am not able to send documents to the other party' });

    this.unableToSendDetails = this.unableToSendDetailsContainer;
    this.unableToSendDetailsSummary = this.unableToSendDetailsContainer.locator('summary');
    this.unableToSendDetailsParagraphOne = this.unableToSendDetailsContainer.getByText(
      'You must contact the court as soon as possible if you are not able to send your documents with the other party. This could be because it is unsafe to do so, there is a court order in place preventing contact, or you do not have their contact details.',
      { exact: true }
    );
    this.unableToSendDetailsParagraphTwo = this.unableToSendDetailsContainer.getByText(
      'If the court has already agreed to send your documents for you, you must email the court to tell them you have uploaded your documents ready for service.',
      { exact: true }
    );
    this.understandCheckbox = this.page.getByRole('checkbox', { name: 'I understand', exact: true });
    this.submitButton = this.page.getByRole('button', { name: 'Submit', exact: true });
    this.understandErrorSummaryLink = this.page
      .getByRole('alert')
      .getByRole('link', { name: "You must select 'I understand' before continuing" });
    this.understandInlineError = this.page.getByText("Error: You must select 'I understand' before continuing", {
      exact: true,
    });
    this.confirmationHeading = this.page.getByRole('heading', { name: 'Documents uploaded', exact: true });
    this.confirmationPanel = this.page.locator('.govuk-panel.govuk-panel--confirmation');
    this.confirmationWhatHappensNextHeading = this.page.getByRole('heading', { name: 'What happens next', exact: true });
    this.confirmationSavedToCaseText = this.page.getByText(
      'Your documents have been uploaded and have been saved to your case',
      { exact: false }
    );
    this.confirmationJudgeReviewText = this.page.getByText(
      'ready for the judge to review at your hearing',
      { exact: false }
    );
    this.confirmationViewFromAccountLink = this.page.getByRole('link', {
      name: 'They can be viewed from your account',
      exact: true,
    });
    this.confirmationReturnLaterText = this.page.getByText(
      'You can come back anytime to upload more documents.',
      { exact: true }
    );
    this.confirmationEmailText = this.page.getByText(
      'You will receive an email to confirm that the upload was successful.',
      { exact: true }
    );
    this.confirmationReturnToAccountButton = this.page.getByRole('button', {
      name: 'Close and return to your account',
      exact: true,
    });
  }

  async ensureCheckUploadPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.CHECK_UPLOAD, {
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    const bodyText = await this.page.locator('body').innerText().catch(() => '');
    if (!isGatewayErrorContent(bodyText)) {
      return;
    }

    // AAT can briefly serve a gateway page after upload submission; reload once and retry the page check.
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(URL_PATTERNS.CHECK_UPLOAD, {
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    const reloadedBodyText = await this.page.locator('body').innerText().catch(() => '');
    if (isGatewayErrorContent(reloadedBodyText)) {
      throw new Error(`Gateway error page detected on check-upload page. URL: ${this.page.url()}`);
    }
  }

  async verifyCheckUploadPageContent(): Promise<void> {
    await this.ensureCheckUploadPageLoaded();
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
    const radio = choice === 'yes' ? this.yesRadio : this.noRadio;
    await expect(radio).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });
    await radio.click();
    await expect(radio).toBeChecked({ timeout: NAVIGATION_TIMEOUT_MS });
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async submitWithoutSelectionAndExpectValidationError(): Promise<void> {
    await this.clickContinue();
    await this.expectVisible([this.errorSummaryTitle, this.uploadMoreErrorSummaryLink, this.uploadMoreInlineError]);
  }

  async selectYesAndContinue(): Promise<void> {
    await this.selectUploadMoreAndContinue('yes', URL_PATTERNS.DOCUMENT_TYPE_SELECTION);
  }

  async selectNoAndContinue(): Promise<void> {
    await this.selectUploadMoreAndContinue('no', URL_PATTERNS.SEND_TO_OTHER_PARTY);
  }

  private async selectUploadMoreAndContinue(choice: 'yes' | 'no', expectedUrl: RegExp): Promise<void> {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await this.selectUploadMore(choice);
      await this.clickContinue();

      try {
        await expect(this.page).toHaveURL(expectedUrl, { timeout: NAVIGATION_TIMEOUT_MS });
        return;
      } catch (error) {
        const bodyText = await this.page.locator('body').innerText().catch(() => '');
        const shouldRetry = attempt === 1 && isGatewayErrorContent(bodyText);

        if (!shouldRetry) {
          throw error;
        }

        // AAT can transiently render a gateway page; reload once and retry the choice.
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await expect(this.page).toHaveURL(URL_PATTERNS.CHECK_UPLOAD, { timeout: NAVIGATION_TIMEOUT_MS });
      }
    }
  }

  async expectSendToOtherPartyHeadingVisible(): Promise<void> {
    await expect(this.sendToOtherPartyHeading).toBeVisible();
  }

  async verifySendToOtherPartyPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.SEND_TO_OTHER_PARTY, {
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    await this.verifyGlobalHeaderAndFooter();

    await this.expectVisible([
      this.serviceNav,
      this.navigationLink,
      this.signOutBtn,
      this.backLink,
      this.sendToOtherPartyHeading,
      this.sendToOtherPartyIntro,
      this.sendToOtherPartyCourtOrderText,
      this.sendToOtherPartyCourtWillNotServeText,
      this.unableToSendDetailsSummary,
      this.understandCheckbox,
      this.submitButton,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);

    await expect(this.understandCheckbox).not.toBeChecked();
    await expect(this.submitButton).toBeEnabled();
    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: '/upload/check-upload' },
    ]);
  }

  async expandUnableToSendGuidanceAndVerifyContent(): Promise<void> {
    await this.unableToSendDetailsSummary.click();
    await expect(this.unableToSendDetails).toHaveAttribute('open', '');
    await this.expectVisible([
      this.unableToSendDetailsParagraphOne,
      this.unableToSendDetailsParagraphTwo,
    ]);
  }

  async submitWithoutUnderstandingAndExpectValidationError(): Promise<void> {
    await this.submitButton.click();

    await this.expectVisible([
      this.errorSummaryTitle,
      this.understandErrorSummaryLink,
      this.understandInlineError,
    ]);

    // Error container presence confirms validation state; aria-invalid may not be set by backend
    await expect(this.page.locator('.govuk-form-group--error').filter({ has: this.understandCheckbox })).toBeVisible();
  }

  async acceptUnderstanding(): Promise<void> {
    await this.understandCheckbox.check();
    await expect(this.understandCheckbox).toBeChecked();
  }

  async clickBackAndExpectCheckUpload(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.CHECK_UPLOAD);
  }

  async clickBackAndExpectUploadDocuments(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.UPLOAD_DOCUMENTS);
  }

  async gotoConfirmationPage(): Promise<void> {
    await this.page.goto('/upload/confirmation');
    await expect(this.page).toHaveURL(URL_PATTERNS.CONFIRMATION);
  }

  async verifyConfirmationPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.CONFIRMATION, {
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    await this.verifyGlobalHeaderAndFooter();

    await this.expectVisible([
      this.serviceNav,
      this.navigationLink,
      this.signOutBtn,
      this.backLink,
      this.confirmationPanel,
      this.confirmationHeading,
      this.confirmationWhatHappensNextHeading,
      this.confirmationSavedToCaseText,
      this.confirmationJudgeReviewText,
      this.confirmationViewFromAccountLink,
      this.confirmationReturnLaterText,
      this.confirmationEmailText,
      this.confirmationReturnToAccountButton,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);

    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: '/upload/send-to-other-party' },
      { locator: this.confirmationViewFromAccountLink, name: 'href', value: '/dashboard' },
      { locator: this.confirmationReturnToAccountButton, name: 'href', value: '/dashboard' },
    ]);
  }

  async clickCloseAndReturnToAccountAndExpectDashboard(): Promise<void> {
    await this.confirmationReturnToAccountButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);
  }

  async clickBackAndExpectSendToOtherParty(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.SEND_TO_OTHER_PARTY);
  }

  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection({
      expectedEmail: CHECK_UPLOAD_EMAIL,
      openingHoursLocator: this.helpOpeningHours,
    });
  }
}
