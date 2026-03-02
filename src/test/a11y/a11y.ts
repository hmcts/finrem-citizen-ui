import { AxeUtils } from '@hmcts/playwright-common';
import { test } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have no accessibility errors on the landing page', async ({ page }) => {
    await page.goto('/');

    const axeUtils = new AxeUtils(page);
    await axeUtils.audit();
  });
});
