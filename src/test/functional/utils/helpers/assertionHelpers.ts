import { expect, type Page } from '@playwright/test';

export type AssertionHelpers = {
  expectExactTextsVisible: (page: Page, texts: string[]) => Promise<void>;
};

export function createAssertionHelpers(): AssertionHelpers {
  return {
    expectExactTextsVisible: async (page: Page, texts: string[]) => {
      for (const text of texts) {
        await expect(page.getByText(text, { exact: true })).toBeVisible();
      }
    },
  };
}
