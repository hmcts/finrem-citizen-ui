import { test } from '../../fixtures/fixtures';


test('Dashboard displays upload documents section and navigates to before you start page @PR', async ({
  dashboardPage,
  beforeYouStartPage,
}) => {
  await dashboardPage.verifyDashboardPageContent();
  await dashboardPage.clickGoToDocumentUpload();
  await beforeYouStartPage.verifyBeforeYouStartPageContent();
});