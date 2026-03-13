import { expect, test } from '@playwright/test';

import { HomePage } from '../pom/homePage.page';


test.describe('HomePage', () => {
  test.skip('User sees correct content on the home page @PR', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.verifyCorrectContent();
    console.log(await page.url());
  });

  test.skip('User can click license link in footer and it opens in the same tab', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.clickLicenceLink();

    const expectedTitle = 'Open Government Licence for public sector information';
    const urlSnippet = 'nationalarchives\\.gov\\.uk/doc/open-government-licence/version/3/';

    await page.waitForURL(new RegExp(urlSnippet));
    await expect(page).toHaveURL(new RegExp(urlSnippet));

    const heading = page.getByRole('heading', { name: expectedTitle, exact: false, level: 1 });
    await expect(heading).toBeAttached();
  });


  test('Homepage Logo has correct alt text using page object method', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.verifyHeaderLogoAltText();
  });


    

});
