import { test as base } from '@playwright/test';

import { HomePage } from '../functional/pom/homePage.page';

type MyFixtures = {
  homePage: HomePage;
};

export const test = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});
