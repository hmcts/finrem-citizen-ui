import { expect, Locator, Page } from '@playwright/test';
 
import { BasePage } from './basePage.page';

// URL path constants for clarity and maintainability
const URL_PATTERNS = {
  CONFIDENTIALITY: /\/upload\/confidentiality/,
  DASHBOARD: /\/dashboard/,
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
  readonly cancelLink: Locator;
  readonly gettingHelpHeader: Locator;
  readonly contactUsForHelpSummary: Locator;
  readonly contactUsForHelpDetails: Locator;
  readonly helpEmailLink: Locator;
  readonly helpTelephoneText: Locator;
  readonly helpOpeningHours: Locator;
  readonly callChargesLink: Locator;

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
    this.exampleAddresses = this.page.getByText('addresses', { exact: true });
    this.exampleLocationDetails = this.page.getByText(
      'any specific location details shown on bank statements or other documents',
      { exact: true }
    );
    this.examplePhoneNumbers = this.page.getByText('phone numbers', { exact: true });
    this.doNotRedactText = this.page.getByText(
      'Do not redact any financial amounts or payee details.',
      { exact: true }
    );
    this.warningMessage = this.page.getByText(
      'Once you submit your documents they will be on the court record. They could be seen by the other party or referred to in a hearing.',
      { exact: false }
    );
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.cancelLink = this.page.getByRole('link', { name: 'Cancel' });
    this.gettingHelpHeader = this.page.getByRole('heading', { name: 'Getting help' });
    this.contactUsForHelpSummary = this.page.locator('summary', { hasText: 'Contact us for help' });
    this.contactUsForHelpDetails = this.page.locator('details', { has: this.contactUsForHelpSummary });
    this.helpEmailLink = this.page.getByRole('link', { name: 'FRCexample@justice.gov.uk' });
    this.helpTelephoneText = this.page.getByText('0300 123 5577');
    this.helpOpeningHours = this.page.getByText('Monday to Friday, 8.30am to 5pm', { exact: false });
    this.callChargesLink = this.page.getByRole('link', {
      name: 'Find out about call charges (opens in new tab)',
    });
  }}