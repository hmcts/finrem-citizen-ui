import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GettingHelpPanel } from './components/gettingHelpPanel.component';

// URL path constants for clarity and maintainability
const URL_PATTERNS = {
  DASHBOARD: /\/dashboard/, // Base path; allows query params
  BEFORE_YOU_START: /\/upload\/before-you-start/, // Base path; allows query params
};

export class DashboardPage extends BasePage {
  readonly userNameHeader: Locator;
  readonly caseHeading: Locator;
  readonly caseNumberText: Locator;
  readonly divorceAccountHeading: Locator;
  readonly divorceAccountLink: Locator;
  readonly latestInformationHeading: Locator;
  readonly latestInformationText: Locator;
  readonly warningText: Locator;
  readonly goToDocumentUploadButton: Locator;
  readonly viewPreviouslyUploadedLink: Locator;
  readonly iWantToHeading: Locator;
  readonly templatesLink: Locator;
  readonly courtExpectationsLink: Locator;
  readonly adviceNowLink: Locator;
  readonly courtBundleLink: Locator;
  readonly gettingHelp: GettingHelpPanel;

  constructor(readonly page: Page) {
    super(page);
    this.userNameHeader = this.page.getByRole('heading', { level: 2, name: /(?:Applicant|Respondent)$/ });
    this.caseHeading = this.page.getByRole('heading', { name: 'Your financial remedy case' });
    this.caseNumberText = this.page.getByText(/Case number\s+/i);
    this.divorceAccountHeading = this.page.getByRole('heading', { name: 'This is your financial remedy account' });
    this.divorceAccountLink = this.page.getByRole('link', { name: 'go to your divorce account (opens in new tab)' });
    this.latestInformationHeading = this.page.getByRole('heading', { name: 'Latest information' });
    this.latestInformationText = this.page.getByText(
      'You are involved in a contested financial remedy case.',
      { exact: false }
    );
    this.warningText = this.page.getByText(
      'Do not use this service to submit applications or anything else that needs a court response.',
      { exact: false }
    );
    this.goToDocumentUploadButton = this.page.getByRole('button', { name: 'Go to document upload' });
    this.viewPreviouslyUploadedLink = this.page.getByRole('link', { name: 'View previously uploaded documents' });
    this.iWantToHeading = this.page.getByRole('heading', { name: 'I want to...' });
    this.templatesLink = this.page.getByRole('link', {
      name: 'Find templates for the most commonly requested documents (opens in new tab)',
    });
    this.courtExpectationsLink = this.page.getByRole('link', {
      name: 'Find out what to expect coming to a court (opens in new tab)',
    });
    this.adviceNowLink = this.page.getByRole('link', {
      name: 'Read advice about representing myself in court from AdviceNow (opens in new tab)',
    });
    this.courtBundleLink = this.page.getByRole('link', {
      name: 'Read advice about preparing a court bundle from Judiciary UK (opens in new tab)',
    });
    this.gettingHelp = new GettingHelpPanel(this.page);
  }

  // Navigate to the dashboard
  async navigateToDashboard(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  // Verify page URL, content visibility, and button navigation target
  async verifyDashboardPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);
    await this.verifyGlobalHeaderAndFooter();

    // Integration environments can render either role heading or generic case heading.
    await expect(this.userNameHeader.or(this.caseHeading).first()).toBeVisible();

    await this.expectVisible([
      this.caseNumberText,
      this.latestInformationHeading,
      this.latestInformationText,
      this.warningText,
      this.goToDocumentUploadButton,
      this.viewPreviouslyUploadedLink,
      this.iWantToHeading,
      this.templatesLink,
      this.courtExpectationsLink,
      this.adviceNowLink,
      this.courtBundleLink,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);

    await this.expectAttributes([
      { locator: this.goToDocumentUploadButton, name: 'href', value: '/upload/before-you-start' },
      { locator: this.templatesLink, name: 'target', value: '_blank' },
      { locator: this.templatesLink, name: 'rel', value: 'noopener noreferrer' },
      { locator: this.courtExpectationsLink, name: 'target', value: '_blank' },
      { locator: this.courtExpectationsLink, name: 'rel', value: 'noopener noreferrer' },
      { locator: this.adviceNowLink, name: 'target', value: '_blank' },
      { locator: this.adviceNowLink, name: 'rel', value: 'noopener noreferrer' },
      { locator: this.courtBundleLink, name: 'target', value: '_blank' },
      { locator: this.courtBundleLink, name: 'rel', value: 'noopener noreferrer' },
    ]);
  }

  // Verify divorce account inset is visible (only when user has divorce case)
  async verifyDivorceAccountInset(): Promise<void> {
    await this.expectVisible([this.divorceAccountHeading, this.divorceAccountLink]);

    await this.expectAttributes([
      { locator: this.divorceAccountLink, name: 'href', value: 'https://www.apply-divorce.service.gov.uk/' },
      { locator: this.divorceAccountLink, name: 'target', value: '_blank' },
      { locator: this.divorceAccountLink, name: 'rel', value: 'noopener noreferrer' },
    ]);
  }

  // Verify divorce account heading is not shown
  async verifyDivorceAccountHeadingHidden(): Promise<void> {
    await expect(this.divorceAccountHeading).toBeHidden();
  }

  async verifyPreviouslyUploadedLinkVisible(): Promise<void> {
    await expect(this.viewPreviouslyUploadedLink).toBeVisible();
  }

  async verifyPreviouslyUploadedLinkHidden(): Promise<void> {
    await expect(this.viewPreviouslyUploadedLink).toBeHidden();
  }

  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection();
  }

  async verifyDivorceAccountInsetIfVisible(): Promise<void> {
    const isVisible = await this.divorceAccountHeading.isVisible();
    if (isVisible) {
      await this.verifyDivorceAccountInset();
      return;
    }

    await this.verifyDivorceAccountHeadingHidden();
  }

  // Click the document upload button
  async clickGoToDocumentUpload(): Promise<void> {
    await this.goToDocumentUploadButton.click();
  }
}
