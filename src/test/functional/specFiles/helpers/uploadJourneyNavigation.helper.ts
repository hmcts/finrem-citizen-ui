import { BasePage } from '../../pom/basePage.page';
import { BeforeYouStartPage } from '../../pom/beforeYouStart.page';
import { ConfidentialityPage } from '../../pom/confidentialityPage.page';
import { DashboardPage } from '../../pom/dashboardPage.page';

export async function navigateToDashboardAndVerifyLayout(
  dashboardPage: DashboardPage,
  basePage: BasePage
): Promise<void> {
  await dashboardPage.navigateToDashboard();
  await basePage.verifyGlobalHeaderAndFooter();
}

export async function navigateToConfidentialityPage(
  dashboardPage: DashboardPage,
  beforeYouStartPage: BeforeYouStartPage,
  basePage: BasePage
): Promise<void> {
  await navigateToDashboardAndVerifyLayout(dashboardPage, basePage);
  await dashboardPage.clickGoToDocumentUpload();
  await beforeYouStartPage.startUploadJourney();
}

export async function navigateToFdrPage(
  dashboardPage: DashboardPage,
  beforeYouStartPage: BeforeYouStartPage,
  confidentialityPage: ConfidentialityPage,
  basePage: BasePage
): Promise<void> {
  await navigateToConfidentialityPage(dashboardPage, beforeYouStartPage, basePage);
  await confidentialityPage.clickContinueAndExpectFdrStep();
}
