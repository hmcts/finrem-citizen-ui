import { test } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have no accessibility errors on the landing page', async ({ page }) => {
    const { AxeUtils } = await import('@hmcts/playwright-common');

    await page.goto('/');
    const axeUtils = new AxeUtils(page);
    await axeUtils.audit();
  });
});
