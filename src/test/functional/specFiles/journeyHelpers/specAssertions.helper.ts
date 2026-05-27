import { AxeUtils } from '@hmcts/playwright-common';
import { type Page } from '@playwright/test';

import { type AuthSession, DEFAULT_AXE_OPTIONS, expect } from '../../../fixtures/fixtures';

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
