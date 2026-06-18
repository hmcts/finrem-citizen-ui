import { expect, Locator, Page } from '@playwright/test';

import { BasePage } from './basePage.page';

const URL_PATTERNS = {
  PREVIOUSLY_UPLOADED: /\/upload\/previously-uploaded-documents(?:\?.*)?$/,
  DOCUMENT_TYPE_SELECTION: /\/upload\/document-type-selection(?:\?.*)?$/,
  DASHBOARD: /\/dashboard(?:\?.*)?$/,
};

export class PreviouslyUploadedDocumentsPage extends BasePage {
  readonly heading: Locator;
  readonly introText: Locator;
  readonly readOnlyText: Locator;
  readonly uploadMoreText: Locator;
  readonly dateAddedHeader: Locator;
  readonly documentTypeHeader: Locator;
  readonly documentNameHeader: Locator;
  readonly tableRows: Locator;
  readonly documentLinks: Locator;
  readonly continueButton: Locator;
  readonly cancelLink: Locator;

  constructor(readonly page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: 'Previously uploaded documents' });
    this.introText = page.getByText('You can download your previously uploaded documents on this page.', { exact: true });
    this.readOnlyText = page.getByText('You cannot delete any documents that have already been uploaded. They have already been saved to your case.', { exact: true });
    this.uploadMoreText = page.getByText('You can upload an updated version of a previously uploaded document, or any additional documentation, if you need to.', { exact: true });

    this.dateAddedHeader = page.getByRole('columnheader', { name: 'Date added' });
    this.documentTypeHeader = page.getByRole('columnheader', { name: 'Document type' });
    this.documentNameHeader = page.getByRole('columnheader', { name: 'Document name' });

    this.tableRows = page.locator('tbody.govuk-table__body tr.govuk-table__row');
    this.documentLinks = page.locator('tbody.govuk-table__body tr.govuk-table__row a.govuk-link');

    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.cancelLink = page.getByRole('button', { name: 'Return to account' });
  }

  async verifyPageContent(): Promise<void> {
    await expect(this.page).toHaveURL(URL_PATTERNS.PREVIOUSLY_UPLOADED);
    await this.verifyGlobalHeaderAndFooter();

    await expect(this.heading).toBeVisible();
    await expect(this.introText).toBeVisible();
    await expect(this.readOnlyText).toBeVisible();
    await expect(this.uploadMoreText).toBeVisible();

    await expect(this.dateAddedHeader).toBeVisible();
    await expect(this.documentTypeHeader).toBeVisible();
    await expect(this.documentNameHeader).toBeVisible();
  }

  async verifyReadOnlyActions(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /delete|edit|replace|remove/i })).toHaveCount(0);
    await expect(this.page.getByRole('link', { name: /delete|edit|replace|remove/i })).toHaveCount(0);
  }

  async verifyDocumentLinkLabelsAreUniqueAndDescriptive(): Promise<void> {
    const linkCount = await this.documentLinks.count();
    const seenLabels = new Set<string>();

    for (let index = 0; index < linkCount; index += 1) {
      const link = this.documentLinks.nth(index);
      await expect(link).toBeVisible();

      const href = await link.getAttribute('href');
      expect(href).toMatch(/^\/documents\/[0-9a-f-]+\/download$/i);

      const label = (await link.getAttribute('aria-label')) ?? '';
      expect(label.trim().length).toBeGreaterThan(0);
      expect(seenLabels.has(label)).toBe(false);
      seenLabels.add(label);
    }
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DOCUMENT_TYPE_SELECTION);
  }

  async clickCancel(): Promise<void> {
    await this.cancelLink.click();
    await expect(this.page).toHaveURL(URL_PATTERNS.DASHBOARD);
  }
}
