import { expect, Locator, Page } from '@playwright/test';

export class BeforeYouStartPage {
  readonly beforeYouStartHeader: Locator;
  readonly backLink: Locator;
  readonly youShouldIntro: Locator;
  readonly courtOrderBullet: Locator;
  readonly prepareDocumentsBullet: Locator;
  readonly namingDocumentsHeader: Locator;
  readonly afterSubmittedHeader: Locator;
  readonly unableToSendSummary: Locator;
  readonly unableToSendDetails: Locator;
  readonly unableToSendDetailsText: Locator;
  readonly startNowButton: Locator;
  readonly gettingHelpHeader: Locator;
  readonly contactUsForHelpSummary: Locator;
  readonly contactUsForHelpDetails: Locator;
  readonly helpEmailLink: Locator;
  readonly helpTelephoneText: Locator;
  readonly callChargesLink: Locator;
  

  constructor(readonly page: Page) {
    this.beforeYouStartHeader = this.page.getByRole('heading', { name: 'Before you start' });
    this.backLink = this.page.getByRole('link', { name: 'Back' });
    this.youShouldIntro = this.page.getByText('You should:', { exact: true });
    this.courtOrderBullet = this.page.getByText('check the court order you have received', { exact: true });
    this.prepareDocumentsBullet = this.page.getByText('prepare all of the documents you wish to upload', { exact: true });
    this.namingDocumentsHeader = this.page.getByRole('heading', { name: 'Naming your documents' });
    this.afterSubmittedHeader = this.page.getByRole('heading', { name: 'After you have submitted' });
    this.unableToSendSummary = this.page.getByText('I am not able to send documents to the other party', { exact: true });
    this.unableToSendDetails = this.page.locator('details', { has: this.unableToSendSummary });
    this.unableToSendDetailsText = this.page.getByText(
      'You must email the court as soon as possible if you are not able to send the documents to the other party.',
      { exact: false }
    );
    this.startNowButton = this.page.getByRole('button', { name: 'Start now' });
    this.gettingHelpHeader = this.page.getByRole('heading', { name: 'Getting help' });
    this.contactUsForHelpSummary = this.page.getByText('Contact us for help', { exact: true });
    this.contactUsForHelpDetails = this.page.locator('details', { has: this.contactUsForHelpSummary });
    this.helpEmailLink = this.page.getByRole('link', { name: 'FRCexample@justice.gov.uk' });
    this.helpTelephoneText = this.page.getByText('0300 123 5577');
    this.callChargesLink = this.page.getByRole('link', {
      name: 'Find out about call charges (opens in new tab)',
    });
  }

  private async expectVisible(locators: Locator[]): Promise<void> {
    for (const locator of locators) {
      await expect(locator).toBeVisible();
    }
  }

  private async expectAttributes(
    assertions: { locator: Locator; name: string; value: string }[]
  ): Promise<void> {
    for (const assertion of assertions) {
      await expect(assertion.locator).toHaveAttribute(assertion.name, assertion.value);
    }
  }

  async verifyBeforeYouStartPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(/\/upload\/before-you-start(?:\?.*)?$/);

    await this.expectVisible([
      this.backLink,
      this.beforeYouStartHeader,
      this.youShouldIntro,
      this.courtOrderBullet,
      this.prepareDocumentsBullet,
      this.namingDocumentsHeader,
      this.afterSubmittedHeader,
      this.unableToSendSummary,
      this.startNowButton,
      this.gettingHelpHeader,
      this.contactUsForHelpSummary,
    ]);

    await this.expectAttributes([
      { locator: this.backLink, name: 'href', value: '/dashboard' },
      { locator: this.startNowButton, name: 'type', value: 'submit' },
    ]);
  }

  async verifyUnableToSendGuidance(): Promise<void> {
    await this.unableToSendSummary.click();
    await expect(this.unableToSendDetails).toHaveAttribute('open', '');
    await expect(this.unableToSendDetailsText).toBeVisible();
  }

  async verifyHelpAndGuidanceClosedByDefault(): Promise<void> {
    await expect(this.unableToSendDetails).not.toHaveAttribute('open', '');
    await expect(this.contactUsForHelpDetails).not.toHaveAttribute('open', '');
  }

  async verifyContactHelpContent(): Promise<void> {
    await this.contactUsForHelpSummary.click();
    await expect(this.contactUsForHelpDetails).toHaveAttribute('open', '');

    await this.expectVisible([
      this.helpEmailLink,
      this.helpTelephoneText,
      this.callChargesLink,
    ]);

    await this.expectAttributes([
      { locator: this.helpEmailLink, name: 'href', value: 'mailto:FRCexample@justice.gov.uk' },
      { locator: this.callChargesLink, name: 'href', value: '#' },
      { locator: this.callChargesLink, name: 'target', value: '_blank' },
      { locator: this.callChargesLink, name: 'rel', value: 'noopener noreferrer' },
    ]);
  }

  async goBackToDashboard(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(/\/dashboard(?:\?.*)?$/);
  }

  async startUploadJourney(): Promise<void> {
    await this.startNowButton.click();
    await expect(this.page).toHaveURL(/\/upload\/confidentiality(?:\?.*)?$/);
  }
}