import { Page, test as base } from '@playwright/test';

import { HomePage } from '../functional/pom/homePage.page';
import { IdamPage } from '../functional/pom/idamPage.page';
import { IdamApiService } from '../functional/utils/helpers/idamCreateUser';

type MyFixtures = {
  homePage: HomePage;
  idamPage: IdamPage;
  idamApi: IdamApiService;
};

export const test = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  idamApi: async ({}, use) => {
    await use(new IdamApiService());
  },

  idamPage: async ({ page }: { page: Page }, use) => {
    await use(new IdamPage(page));
  },
});
