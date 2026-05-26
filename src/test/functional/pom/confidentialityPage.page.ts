import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';
import { GettingHelpPanel } from './components/gettingHelpPanel.component';

// URL path constants 
const URL_PATTERNS = {
  CONFIDENTIALITY: /\/upload\/confidentiality/,
  DASHBOARD: /\/dashboard/,
  FDR: /\/upload\/fdr/,
};

const EXTERNAL_LINKS = {
  FORM_C8:
    'https://www.gov.uk/government/publications/form-c8-confidential-contact-details-family-procedure-rules-2010-rule-291',
  CALL_CHARGES: 'https://www.gov.uk/call-charges',
};

export class ConfidentialityPage extends BasePage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly formC8Link: Locator;
  readonly redactionInstructions: Locator;
  readonly courtStaffDisclaimer: Locator;
  readonly confidentialExamplesIntro: Locator;
  readonly exampleAddresses: Locator;
  readonly exampleLocationDetails: Locator;
  readonly examplePhoneNumbers: Locator;
  readonly doNotRedactText: Locator;
  readonly warningMessage: Locator;
  readonly continueButton: Locator;
  readonly gettingHelp: GettingHelpPanel;
  readonly helpOpeningHours: Locator;

  constructor(readonly page: Page) {
    super(page);
    this.pageHeader = this.page.getByRole('heading', {
      name: 'Keeping information confidential for safety reasons',
    });
    this.backLink = this.page.getByRole('link', { name: 'Back' });
    this.formC8Link = this.page.getByRole('link', {
      name: 'applied to the court to keep your contact details confidential using form C8 (opens in new tab)',
    });
    this.redactionInstructions = this.page.getByText(
      'You must redact (black out the text) any such information if you need to keep it private from the other party.',
      { exact: false }
    );
    this.courtStaffDisclaimer = this.page.getByText(
      'Court staff are not able to check any documents you submit to the court for any unintentional disclosure of your details.',
      { exact: false }
    );
    this.confidentialExamplesIntro = this.page.getByText(
      'Confidential information could be, for example:',
      { exact: true }
    );

    const confidentialExamplesList = this.page
      .getByRole('main')
      .getByRole('list')
      .filter({ hasText: 'addresses' })
      .first();

    this.exampleAddresses = confidentialExamplesList.getByRole('listitem').filter({ hasText: 'addresses' });
    this.exampleLocationDetails = confidentialExamplesList
      .getByRole('listitem')
      .filter({ hasText: 'any specific location details shown on bank statements or other documents' });
    this.examplePhoneNumbers = confidentialExamplesList.getByRole('listitem').filter({ hasText: 'phone numbers' });
    this.doNotRedactText = this.page.getByText(
      'Do not redact any financial amounts or payee details.',
      { exact: true }
    );
    this.warningMessage = this.page.getByText(
      'Once you submit your documents they will be on the court record. They could be seen by the other party or referred to in a hearing.',
      { exact: false }
    );
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.gettingHelp = new GettingHelpPanel(this.page);
    this.helpOpeningHours = this.page.getByText('Monday to Friday, 8.30am to 5pm', { exact: false });
  }

    // AC1: Verify page URL and core layout elements
  async verifyConfidentialityPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.CONFIDENTIALITY);
    await this.verifyGlobalHeaderAndFooter();
 
    await this.expectVisible([
      this.serviceNav,
      this.navigationLink,
      this.signOutBtn,
      this.pageHeader,
      this.backLink,
      this.continueButton,
      this.gettingHelp.heading,
      this.gettingHelp.summary,
    ]);
  }

    // AC2: Verify form C8 link is present and points to the correct GOV.UK URL
  async verifyFormC8Link(): Promise<void> {
    await this.expectVisible([this.formC8Link]);
    await this.expectAttributes([
      { locator: this.formC8Link, name: 'href', value: EXTERNAL_LINKS.FORM_C8 },
      { locator: this.formC8Link, name: 'target', value: '_blank' },
      { locator: this.formC8Link, name: 'rel', value: 'noopener noreferrer' },
    ]);
  }

    // AC3: Verify redaction instructions are displayed
  async verifyRedactionInstructions(): Promise<void> {
    await expect(this.redactionInstructions).toBeVisible();
  }

    // AC4: Verify court staff disclaimer is displayed
  async verifyCourtStaffDisclaimer(): Promise<void> {
    await expect(this.courtStaffDisclaimer).toBeVisible();
  }

    // AC5: Verify confidential information examples and do-not-redact guidance
  async verifyConfidentialInformationExamples(): Promise<void> {
    await this.expectVisible([
      this.confidentialExamplesIntro,
      this.exampleAddresses,
      this.exampleLocationDetails,
      this.examplePhoneNumbers,
      this.doNotRedactText,
    ]);
  }

    // AC6: Verify warning message about documents being on the court record
  async verifyCourtRecordWarning(): Promise<void> {
    await expect(this.warningMessage).toBeVisible();
  }

  // AC7: Assert Continue button is visible and enabled
  async verifyContinueButton(): Promise<void> {
    await expect(this.continueButton).toBeVisible();
    await expect(this.continueButton).toBeEnabled();
  }

  // AC7: Click Continue and assert navigation to FDR step
  async clickContinueAndExpectFdrStep(): Promise<void> {
    await this.continueButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.FDR);
  }

  // Keep panel expansion, so tests do not accidentally toggle it closed
  async expandContactHelpIfCollapsed(): Promise<void> {
    await this.gettingHelp.expandIfCollapsed();
  }

  // Collapse helper for tests to assert closed/open behavior
  async collapseContactHelpIfExpanded(): Promise<void> {
    await this.gettingHelp.collapseIfExpanded();
  }

  // AC9: Verify getting help section end-to-end (collapsed state + expanded content)
  async verifyGettingHelpSection(): Promise<void> {
    await this.gettingHelp.verifySection({
      openingHoursLocator: this.helpOpeningHours,
      callChargesHref: EXTERNAL_LINKS.CALL_CHARGES,
    });
  }

}