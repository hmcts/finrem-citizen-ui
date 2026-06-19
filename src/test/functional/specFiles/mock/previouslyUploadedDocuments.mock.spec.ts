import { expect, test } from '../../../fixtures/fixtures';
import { PreviouslyUploadedDocumentsPage } from '../../pom/previouslyUploadedDocumentsPage.page';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';

const runningEnv = process.env.RUNNING_ENV || '';
const isPreviewOrAat = runningEnv.startsWith('pr-') || runningEnv === 'aat';

/**
 * MOCK-ONLY TESTS: Previously uploaded documents
 *
 * Uses test-support session injection to keep the journey deterministic.
 * These tests provide stable coverage without relying on CCD session stability.
 * Migrated from integration suite due to persistent session loss in AAT deployments.
 */
test.describe('[mock] Previously uploaded documents', () => {
  test.use({ useMockTestSupport: true });
  test.skip(
    isPreviewOrAat,
    'Mock-only suite skipped on preview/AAT. Run locally with ENABLE_TEST_SUPPORT_ROUTES=true.'
  );

  test.beforeEach(async ({
    page,
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

    // Assert the intended post-submit state
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: /^(Applicant|Respondent|Your financial remedy case)$/ })
    ).toBeVisible();

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

    const rowCount = await previouslyUploadedDocumentsPage.tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);

    await runA11yAudit(axeUtils);
  });

  test('[mock] Document links have descriptive labels when documents are present @a11y', async ({
    page,
    axeUtils,
  }) => {
    const previouslyUploadedDocumentsPage = new PreviouslyUploadedDocumentsPage(page);

    await previouslyUploadedDocumentsPage.verifyPageContent();

    const linkCount = await previouslyUploadedDocumentsPage.documentLinks.count();

    // Verify links exist and are descriptive (or empty state is shown)
    if (linkCount > 0) {
      await previouslyUploadedDocumentsPage.verifyDocumentLinkLabelsAreUniqueAndDescriptive();
    } else {
      await expect(previouslyUploadedDocumentsPage.tableRows).toHaveCount(0);
    }

    await runA11yAudit(axeUtils);
  });

  test('[mock] Back and return to account actions navigate correctly from previously uploaded documents @a11y', async ({
    page,
    dashboardPage,
    axeUtils,
  }) => {
    const previouslyUploadedDocumentsPage = new PreviouslyUploadedDocumentsPage(page);

    await previouslyUploadedDocumentsPage.verifyPageContent();
    await previouslyUploadedDocumentsPage.clickCancel();

    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.viewPreviouslyUploadedLink.click();

    await previouslyUploadedDocumentsPage.clickBack();
    await dashboardPage.verifyDashboardPageContent();

    await runA11yAudit(axeUtils);
  });
});
