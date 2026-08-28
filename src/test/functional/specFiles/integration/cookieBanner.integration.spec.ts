import { Page } from '@playwright/test';

import { PublicRoutes } from '../../../../main/common-constants';
import { expect, test } from '../../../fixtures/fixtures';

const clearCookiePreferences = async (page: Page): Promise<void> => {
  await page.context().clearCookies();
};

test.describe('[integration] Cookie banner behavior', () => {
  test('[integration] First visit shows cookie banner on non-cookies pages @a11y', async ({ page }) => {
    await clearCookiePreferences(page);
    await page.goto('/page-not-found');

    await expect(page.locator('.cookie-banner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept analytics cookies' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reject analytics cookies' })).toBeVisible();
  });

  test('[integration] Rejecting analytics cookies persists and hides banner on reload @a11y', async ({ page }) => {
    await clearCookiePreferences(page);
    await page.goto('/cookie-banner-persistence-check');

    await page.getByRole('button', { name: 'Reject analytics cookies' }).click();
    await expect(page.getByText("You've rejected analytics cookies.")).toBeVisible();

    await page.reload();
    await expect(page.locator('.cookie-banner')).toBeHidden();

    const cookies = await page.context().cookies();
    const preferenceCookie = cookies.find(
      cookie => cookie.name === 'cookie-preferences' || cookie.name === 'finrem-cookie-preferences'
    );
    expect(preferenceCookie).toBeDefined();
  });

  test('[integration] Cookies settings page shows preferences form and suppresses banner @a11y', async ({ page }) => {
    await clearCookiePreferences(page);
    await page.goto(PublicRoutes.cookies);

    await expect(page.locator('.cookie-preferences-form')).toBeVisible();
    await expect(page.locator('.cookie-banner')).toBeHidden();
  });
});
