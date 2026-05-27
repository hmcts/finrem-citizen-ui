import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GettingHelpPanel } from './components/gettingHelpPanel.component';

// URL path constants
const URL_PATTERNS = {
  BEFORE_YOU_START: /\/upload\/before-you-start/,
  DASHBOARD: /\/dashboard/, 
  CONFIDENTIALITY: /\/upload\/confidentiality/,
};

const CALL_CHARGES_LINK = 'https://www.gov.uk/call-charges';

export class BeforeYouStartPage extends BasePage {
  readonly govUkHeader: Locator;
  readonly serviceNavigation: Locator;
  readonly serviceNameLink: Locator;
  readonly beforeYouStartHeader: Locator;
  readonly backLink: Locator;
  readonly youShouldIntro: Locator;
  readonly courtOrderBullet: Locator;
  readonly prepareDocumentsBullet: Locator;
  readonly namingDocumentsHeader: Locator;
  readonly namingGuidanceText: Locator;
  readonly namingRenameText: Locator;
  readonly afterSubmittedHeader: Locator;
  readonly afterSubmittedCaseFileText: Locator;
  readonly afterSubmittedOnlineAccountText: Locator;
  readonly transparencyResponsibilitiesText: Locator;
  readonly unableToSendSummary: Locator;
  readonly unableToSendDetails: Locator;
  readonly unableToSendToggle: Locator;
  readonly unableToSendDetailsText: Locator;
  readonly startNowButton: Locator;
  readonly helpOpeningHours: Locator;
  readonly gettingHelp: GettingHelpPanel;
  

  constructor(readonly page: Page) {
    super(page);
    this.govUkHeader = this.page.getByRole('banner');
    this.serviceNavigation = this.page.getByRole('region', { name: 'Service information' });
    this.serviceNameLink = this.page.getByRole('link', { name: 'Dividing your money and property' });
    this.beforeYouStartHeader = this.page.getByRole('heading', { name: 'Before you start' });
    this.backLink = this.page.getByRole('link', { name: 'Back', exact: true });
    this.youShouldIntro = this.page.getByText('You should:', { exact: true });
    this.courtOrderBullet = this.page.getByText('check the court order you have received', { exact: true });
    this.prepareDocumentsBullet = this.page.getByText('prepare all of the documents you wish to upload', { exact: true });
    this.namingDocumentsHeader = this.page.getByRole('heading', { name: 'Naming your documents' });
    this.namingGuidanceText = this.page.getByText(
      'To help the court identify and assess your documents, make sure you name them appropriately, for example, [name]-bankstatement-[month][year].',
      { exact: false }
    );
    this.namingRenameText = this.page.getByText(
      'Some of your documents may be automatically renamed when you upload them. We will tell you if your document will be renamed as you upload them.',
      { exact: false }
    );
    this.afterSubmittedHeader = this.page.getByRole('heading', { name: 'After you have submitted' });
    this.afterSubmittedCaseFileText = this.page.getByText(
      'Once you have uploaded your documents, they will be added to your case file and the court will be able to view them. You will receive an email confirmation that they have been added to your case.',
      { exact: false }
    );
    this.afterSubmittedOnlineAccountText = this.page.getByText(
      'You will be able to view any documents you have uploaded on your online account.',
      { exact: false }
    );
    this.transparencyResponsibilitiesText = this.page.getByText(
      'For full transparency between you and the other party, you will need to send any documents you upload here to them, or to their solicitor if they have one.',
      { exact: false }
    );
    this.unableToSendDetails = this.page.locator('details').filter({
      hasText: 'I am not able to send documents to the other party',
    });
    this.unableToSendSummary = this.unableToSendDetails.locator('summary').filter({
      hasText: 'I am not able to send documents to the other party',
    });
    this.unableToSendToggle = this.unableToSendDetails.locator('summary');
    this.unableToSendDetailsText = this.page.getByText(
      'You must email the court as soon as possible if you are not able to send the documents to the other party.',
      { exact: false }
    );
    this.startNowButton = this.page.getByRole('button', { name: 'Start now' });
    this.gettingHelp = new GettingHelpPanel(this.page);
    this.helpOpeningHours = this.gettingHelp.details.getByText('Monday to Friday, 8.30am to 5pm', {
      exact: false,
    });
  }

  // Verify page URL and content
  async verifyBeforeYouStartPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.BEFORE_YOU_START);
    await this.verifyGlobalHeaderAndFooter();

    await this.expectVisible([
      this.beforeYouStartHeader,
      this.backLink,
      this.startNowButton,
      this.youShouldIntro,
      this.courtOrderBullet,
      this.prepareDocumentsBullet,
      this.namingDocumentsHeader,
      this.afterSubmittedHeader,
      this.unableToSendSummary,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);

    // Verify navigation links work correctly
    await expect(this.backLink).toHaveAttribute('href', '/dashboard');

    // Verify start button is properly set up for form submission
    await expect(this.startNowButton).toHaveAttribute('type', 'submit');
  }

  // Expand unable-to-send details panel and verify content is visible
  async verifyUnableToSendGuidance(): Promise<void> {
    await this.unableToSendToggle.click();
    await expect(this.unableToSendDetails).toHaveAttribute('open', '');
    await expect(this.unableToSendDetailsText).toBeVisible();
  }

  // Verify both guidance panels start in collapsed state
  async verifyHelpAndGuidanceClosedByDefault(): Promise<void> {
    await expect(this.unableToSendDetails).not.toHaveAttribute('open', '');
    await this.gettingHelp.verifyClosedByDefault();
  }

  // Verify getting help section end-to-end (collapsed state + expanded content)
  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection({
      openingHoursLocator: this.helpOpeningHours,
      callChargesHref: CALL_CHARGES_LINK,
    });
  }

  async verifyBeforeYouStartAcceptanceCriteriaContent(): Promise<void> {
    await this.verifyBeforeYouStartPageContent();

    await this.expectVisible([
      this.govUkHeader,
      this.serviceNavigation,
      this.serviceNameLink,
      this.signOutBtn,
      this.namingGuidanceText,
      this.namingRenameText,
      this.afterSubmittedCaseFileText,
      this.afterSubmittedOnlineAccountText,
      this.transparencyResponsibilitiesText,
    ]);

    await this.expectAttributes([
      { locator: this.serviceNameLink, name: 'href', value: '/' },
      { locator: this.signOutBtn, name: 'href', value: '/logout' },
    ]);

    await this.verifyGettingHelpSection();
  }

  // Click back link and verify navigation to dashboard
  async goBackToDashboard(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);
  }

  // Click start button and verify navigation to confidentiality page
  async startUploadJourney(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(URL_PATTERNS.CONFIDENTIALITY, { timeout: 15_000 }),
      this.startNowButton.click(),
    ]);
  }
}