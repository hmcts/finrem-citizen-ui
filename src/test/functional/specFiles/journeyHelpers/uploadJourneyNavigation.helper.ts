import { expect } from '@playwright/test';

import { BasePage } from '../../pom/basePage.page';
import { BeforeYouStartPage } from '../../pom/beforeYouStart.page';
import { CheckUploadPage } from '../../pom/checkUploadPage.page';
import { ConfidentialityPage } from '../../pom/confidentialityPage.page';
import { DashboardPage } from '../../pom/dashboardPage.page';
import { DocumentSelectionPage } from '../../pom/documentSelectionPage.page';
import { DocumentUploadPage } from '../../pom/documentUploadPage.page';
import { EnterCaseNumberPage } from '../../pom/enterCaseNumber.page';
import { FdrPage } from '../../pom/fdrPage.page';

export async function navigateToDashboardStep(
  dashboardPage: DashboardPage,
  basePage: BasePage
): Promise<void> {
  await dashboardPage.navigateToDashboard();

  // Keep shared shell check
  await basePage.verifyGlobalHeaderAndFooter();

  // Fail fast with a clear cause if backend/session routing returned error page
  await expect(
    dashboardPage.page.getByRole('heading', { name: 'Sorry, there is a problem with the service' })
  ).toHaveCount(0);

  // Assert page-specific readiness before any click
  await dashboardPage.verifyDashboardPageContent();
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

export async function navigateToUploadDocumentsStep(
  dashboardPage: DashboardPage,
  beforeYouStartPage: BeforeYouStartPage,
  confidentialityPage: ConfidentialityPage,
  basePage: BasePage,
  fdrPage: FdrPage
): Promise<void> {
  await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
  await fdrPage.selectYesAndContinue();
}

export async function navigateToCheckUploadWithOtherDocument(
  options: {
    dashboardPage: DashboardPage;
    beforeYouStartPage: BeforeYouStartPage;
    confidentialityPage: ConfidentialityPage;
    basePage: BasePage;
    fdrPage: FdrPage;
    documentSelectionPage: DocumentSelectionPage;
    documentUploadPage: DocumentUploadPage;
    checkUploadPage: CheckUploadPage;
  }
): Promise<void> {
  const {
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
    fdrPage,
    documentSelectionPage,
    documentUploadPage,
    checkUploadPage,
  } = options;

  await navigateToUploadDocumentsStep(
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
    fdrPage
  );

  await documentSelectionPage.addOtherDocumentAndContinue();
  await documentUploadPage.chooseFileAndUploadDocx();
  await documentUploadPage.clickContinue();
  await checkUploadPage.verifyCheckUploadPageContent();
}

export async function navigateToAccessCodeStep(
  enterCaseNumberPage: EnterCaseNumberPage,
  caseNumber: string
): Promise<void> {
  await enterCaseNumberPage.submitCaseNumber(caseNumber);
  await expect(enterCaseNumberPage.page).toHaveURL(/\/enter-access-code$/);
}
