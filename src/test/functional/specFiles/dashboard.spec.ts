import { test } from '../../fixtures/fixtures';
import { BeforeYouStartPage } from '../pom/beforeYouStart.page';

test('Dashboard displays upload documents section and navigates to before you start page @PR', async ({
  dashboardPage,
  page,
}) => {
  const beforeYouStartPage = new BeforeYouStartPage(page);

  await dashboardPage.verifyDashboardPageContent();
  await dashboardPage.clickGoToDocumentUpload();
  await beforeYouStartPage.verifyBeforeYouStartPageContent();
});