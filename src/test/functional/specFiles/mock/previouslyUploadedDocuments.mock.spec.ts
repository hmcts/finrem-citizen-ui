import { test } from '../../../fixtures/fixtures';
import { PreviouslyUploadedDocumentsPage } from '../../pom/previouslyUploadedDocumentsPage.page';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';

/**
 * MOCK-ONLY TESTS: Previously uploaded documents
 *
 * Uses test-support session injection to keep the journey deterministic.
 */
test.describe('[mock] Previously uploaded documents', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    basePage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    dashboardPage,
  }) => {
    await basePage.injectCaseSession(
      contestedCaseWithHearing.caseId,
      contestedCaseWithHearing.applicantAccessCode,
      contestedCaseWithHearing.respondentAccessCode
    );

    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.viewPreviouslyUploadedLink.click();
  });

  test('[mock] Empty previously uploaded documents page is displayed as read-only with key table headers @a11y', async ({
    page,
    axeUtils,
  }) => {
    const previouslyUploadedDocumentsPage = new PreviouslyUploadedDocumentsPage(page);

    await previouslyUploadedDocumentsPage.verifyPageContent();
    await previouslyUploadedDocumentsPage.verifyReadOnlyActions();
    await runA11yAudit(axeUtils);
  });

  test('[mock] Continue and cancel actions navigate correctly from previously uploaded documents @a11y', async ({
    page,
    dashboardPage,
    axeUtils,
  }) => {
    const previouslyUploadedDocumentsPage = new PreviouslyUploadedDocumentsPage(page);

    await previouslyUploadedDocumentsPage.verifyPageContent();
    await previouslyUploadedDocumentsPage.clickCancel();

    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.viewPreviouslyUploadedLink.click();

    await previouslyUploadedDocumentsPage.clickContinue();
    await runA11yAudit(axeUtils);
  });
});
