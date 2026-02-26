import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { test } from '../fixtures/fixtures';

const { Given, When, Then } = createBdd(test);

// Helper function to map page names to expected URL paths
function getExpectedUrlPath(pageName: string): string {
  const lowerCasePageName = pageName.toLowerCase();
  if (lowerCasePageName.includes('open government licence')) {
    return 'nationalarchives.gov.uk/doc/open-government-licence/version/3/';
  } else {
    // Fallback for other pages, which assumes page names map directly to URL paths
    return `/${lowerCasePageName.replace(/\s/g, '-')}`;
  }
}

Given('I am on the home page', async ({ homePage }) => {
  await homePage.goto();
});

When('I click on the {string} link', async ({ homePage }, linkName: string) => {
  if (linkName.toLowerCase() === 'license') {
    await homePage.clickLicenceLink();
  } else {
    await homePage.clickLinkByText(linkName);
  }
});

Then('I should be on the {string} page', async ({ page }, expectedTitle: string) => {
  const urlSnippet = getExpectedUrlPath(expectedTitle);

  await page.waitForURL(new RegExp(urlSnippet));
  await expect(page).toHaveURL(new RegExp(urlSnippet));

  const heading = page.getByRole('heading', { name: expectedTitle, exact: false, level: 1 });

  await expect(heading).toBeAttached();
  await expect(heading).toContainText(expectedTitle, { ignoreCase: true });
});

Then('I should see correct content', async ({ homePage }) => {
  await homePage.verifyCorrectContent();
});
