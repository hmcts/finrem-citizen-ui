import { test } from '../fixtures/fixtures';

const accessibilityPages = [
  { name: 'landing page', url: '/', needsAuth: false },
  { name: 'enter case number page', url: '/enter-case-number', needsAuth: true },
  { name: 'enter access code page', url: '/enter-access-code', needsAuth: true },
];

test.describe('Accessibility Audit', () => {
  for (const { name, url, needsAuth } of accessibilityPages) {
    test(`should have no accessibility errors on the ${name}`, async ({
      page,
      loggedInPage: _loggedInPage,
      basePage,
    }) => {
      const { AxeUtils } = await import('@hmcts/playwright-common');

      if (needsAuth) {
        await page.goto(url);
      } else {
        await basePage.goto();
      }

      await page.waitForLoadState('networkidle');
      const axeUtils = new AxeUtils(page);
      await axeUtils.audit();
    });
  }
});
