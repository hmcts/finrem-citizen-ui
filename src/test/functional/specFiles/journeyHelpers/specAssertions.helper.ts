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

export async function runA11yAudit(axeUtils: AxeUtils, explicitPage?: Page): Promise<void> {
  await axeUtils.audit(DEFAULT_AXE_OPTIONS);

  // Accessibility-tree check acts as a screen-reader proxy assertion for each audited state.
  const page = explicitPage ?? (axeUtils as unknown as { page: Page }).page;
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
