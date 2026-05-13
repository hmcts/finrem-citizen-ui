import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GettingHelpPanel } from './components/gettingHelpPanel.component';

// URL path constants
const URL_PATTERNS = {
  BEFORE_YOU_START: /\/upload\/before-you-start/,
  DASHBOARD: /\/dashboard/, 
  CONFIDENTIALITY: /\/upload\/confidentiality/,
};

export class BeforeYouStartPage extends BasePage {
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
  readonly gettingHelp: GettingHelpPanel;
  

  constructor(readonly page: Page) {
    super(page);
    this.beforeYouStartHeader = this.page.getByRole('heading', { name: 'Before you start' });
    this.backLink = this.page.getByRole('link', { name: 'Back' });
    this.youShouldIntro = this.page.getByText('You should:', { exact: true });
    this.courtOrderBullet = this.page.getByText('check the court order you have received', { exact: true });
    this.prepareDocumentsBullet = this.page.getByText('prepare all of the documents you wish to upload', { exact: true });
    this.namingDocumentsHeader = this.page.getByRole('heading', { name: 'Naming your documents' });
    this.afterSubmittedHeader = this.page.getByRole('heading', { name: 'After you have submitted' });
    this.unableToSendSummary = this.page.locator('summary', { hasText: 'I am not able to send documents to the other party' });
    this.unableToSendDetails = this.page.locator('details', { has: this.unableToSendSummary });
    this.unableToSendDetailsText = this.page.getByText(
      'You must email the court as soon as possible if you are not able to send the documents to the other party.',
      { exact: false }
    );
    this.startNowButton = this.page.getByRole('button', { name: 'Start now' });
    this.gettingHelp = new GettingHelpPanel(this.page);
  }

  // Verify page URL and content
  async verifyBeforeYouStartPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.BEFORE_YOU_START);

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
    await this.unableToSendSummary.click();
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
    await this.gettingHelp.verifySection();
  }

  // Click back link and verify navigation to dashboard
  async goBackToDashboard(): Promise<void> {
    await this.backLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);
  }

  // Click start button and verify navigation to confidentiality page
  async startUploadJourney(): Promise<void> {
    await this.startNowButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.CONFIDENTIALITY);
  }
}