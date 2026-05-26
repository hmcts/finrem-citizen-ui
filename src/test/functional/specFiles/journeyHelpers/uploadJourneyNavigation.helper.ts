import { expect } from '@playwright/test';

import { BasePage } from '../../pom/basePage.page';
import { BeforeYouStartPage } from '../../pom/beforeYouStart.page';
import { ConfidentialityPage } from '../../pom/confidentialityPage.page';
import { DashboardPage } from '../../pom/dashboardPage.page';
import { EnterCaseNumberPage } from '../../pom/enterCaseNumber.page';

export async function navigateToDashboardStep(
  dashboardPage: DashboardPage,
  basePage: BasePage
): Promise<void> {
  await dashboardPage.navigateToDashboard();
  await basePage.verifyGlobalHeaderAndFooter();
}

export async function navigateToConfidentialityStep(
  dashboardPage: DashboardPage,
  beforeYouStartPage: BeforeYouStartPage,
  basePage: BasePage
): Promise<void> {
  await navigateToDashboardStep(dashboardPage, basePage);
  await dashboardPage.clickGoToDocumentUpload();
  await beforeYouStartPage.startUploadJourney();
}

export async function navigateToFdrStep(
  dashboardPage: DashboardPage,
  beforeYouStartPage: BeforeYouStartPage,
  confidentialityPage: ConfidentialityPage,
  basePage: BasePage
): Promise<void> {
  await navigateToConfidentialityStep(dashboardPage, beforeYouStartPage, basePage);
  await confidentialityPage.clickContinueAndExpectFdrStep();
}

export async function navigateToAccessCodeStep(
  enterCaseNumberPage: EnterCaseNumberPage,
  caseNumber: string
): Promise<void> {
  await enterCaseNumberPage.submitCaseNumber(caseNumber);
  await expect(enterCaseNumberPage.page).toHaveURL(/\/enter-access-code$/);
}
