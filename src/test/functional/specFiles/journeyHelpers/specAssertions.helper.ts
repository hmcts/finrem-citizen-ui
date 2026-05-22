import { AxeUtils } from '@hmcts/playwright-common';

import { type AuthSession, DEFAULT_AXE_OPTIONS, expect } from '../../../fixtures/fixtures';

export function expectAuthenticated(session: AuthSession): void {
  expect(session.authStatus).toBe('success');
}

export async function runA11yAudit(axeUtils: AxeUtils): Promise<void> {
  await axeUtils.audit(DEFAULT_AXE_OPTIONS);
}
