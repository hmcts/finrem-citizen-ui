import { AxeUtils } from '@hmcts/playwright-common';
import { type Page } from '@playwright/test';

import { type AuthSession, DEFAULT_AXE_OPTIONS, expect } from '../../../fixtures/fixtures';
import { DocumentUploadPage } from '../../pom/documentUploadPage.page';

export function expectAuthenticated(session: AuthSession): void {
  expect(session.authStatus).toBe('success');
}

const A11Y_AUDIT_MARKER = Symbol('a11y-audit-ran');

type MarkedPage = Page & {
  [A11Y_AUDIT_MARKER]?: boolean;
};

export function hasRunA11yAudit(page: Page): page is MarkedPage {
  return Boolean((page as MarkedPage)[A11Y_AUDIT_MARKER]);
}

function isTransientA11yNavigationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /documentElement|flattenTree|runPartialRecursive|Execution context was destroyed/i.test(message);
}

function isGatewayErrorContent(text: string): boolean {
  return /bad gateway|upstream connect error|502/i.test(text);
}

async function waitForStableAuditDom(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    const doc = globalThis.document;
    return Boolean(doc?.documentElement) && doc.readyState !== 'loading';
  });
}

async function ensureAuditablePageContent(page: Page): Promise<void> {
  const bodyText = await page.locator('body').innerText();

  if (!isGatewayErrorContent(bodyText)) {
    return;
  }

  // Transient gateway pages appear in AAT occasionally; retry once before failing.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForStableAuditDom(page);

  const reloadedBodyText = await page.locator('body').innerText();
  if (isGatewayErrorContent(reloadedBodyText)) {
    throw new Error(
      `Gateway error page detected before accessibility audit. URL: ${page.url()}`
    );
  }
}

export async function runA11yAudit(axeUtils: AxeUtils, explicitPage?: Page): Promise<void> {
  const page = explicitPage ?? (axeUtils as unknown as { page: Page }).page;

  // Route transitions can briefly detach frame DOM; guard before running axe.
  await waitForStableAuditDom(page);
  await ensureAuditablePageContent(page);

  try {
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  } catch (error) {
    if (!isTransientA11yNavigationError(error)) {
      throw error;
    }

    // One retry handles occasional frame/DOM churn during route transitions.
    await waitForStableAuditDom(page);
    await ensureAuditablePageContent(page);
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  }

  // Accessibility-tree check acts as a screen-reader proxy assertion for each audited state.
  const ariaSnapshot = await page.locator('main, body').first().ariaSnapshot();
  expect(ariaSnapshot).toBeTruthy();
  (page as MarkedPage)[A11Y_AUDIT_MARKER] = true;
}

export async function assertUploadPageCoreContent(documentUploadPage: DocumentUploadPage): Promise<void> {
  await documentUploadPage.verifyGlobalHeaderAndFooter();

  await expect(documentUploadPage.serviceNav).toBeVisible();
  await expect(documentUploadPage.navigationLink).toBeVisible();
  await expect(documentUploadPage.signOutBtn).toBeVisible();
  await expect(documentUploadPage.backLink).toBeVisible();

  await expect(documentUploadPage.pageHeader).toBeVisible();
  await expect(documentUploadPage.introText).toBeVisible();
  await expect(documentUploadPage.instructionTitleLabel.first()).toBeVisible();
  await expect(documentUploadPage.instructionText.first()).toBeVisible();

  await expect(documentUploadPage.chooseFileButton.first()).toBeVisible();
  await expect(documentUploadPage.uploadFileButton.first()).toBeVisible();
  await expect(documentUploadPage.continueButton).toBeVisible();

  await expect(documentUploadPage.gettingHelp.heading).toBeVisible();
  await expect(documentUploadPage.gettingHelp.summary).toBeVisible();
}

export async function assertUploadedFileVisible(
  documentUploadPage: DocumentUploadPage,
  filename: string
): Promise<void> {
  await expect(documentUploadPage.getUploadedFileByName(filename)).toBeVisible();
  await expect(documentUploadPage.filesListDefaultMessage).toBeHidden();
}

export async function assertNoFilesValidationError(documentUploadPage: DocumentUploadPage): Promise<void> {
  const noFileError = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');
  await expect(noFileError).toBeVisible();
  await expect(documentUploadPage.uploadedFileLinks).toHaveCount(0);
}
