import { expect, test } from '../../../fixtures/fixtures';

test.describe('[integration] CSRF protection', () => {
  test('[integration] POST without CSRF token is rejected and redirected to csrf error page', async ({
    loggedInPage,
    page,
  }) => {
    await expect(loggedInPage).toBeTruthy();
    await expect(page).toHaveURL(/\/enter-case-number$/);

    await page.locator('input[name="_csrf"]').evaluate(node => node.remove());
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/csrf-error$/);
  });

  test('[integration] POST with tampered CSRF token is rejected and redirected to csrf error page', async ({
    loggedInPage,
    page,
  }) => {
    await expect(loggedInPage).toBeTruthy();
    await expect(page).toHaveURL(/\/enter-case-number$/);

    await page.locator('input[name="_csrf"]').evaluate(node => {
      if (node instanceof HTMLInputElement) {
        node.value = 'invalid-csrf-token';
      }
    });
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/csrf-error$/);
  });
});
