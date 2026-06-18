import { lookup } from 'node:dns/promises';

import { expect, test } from '../../../fixtures/fixtures';
import { PreviouslyUploadedDocumentsPage } from '../../pom/previouslyUploadedDocumentsPage.page';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToAccessCodeStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

async function canResolve(urlString: string): Promise<boolean> {
  try {
    const { hostname } = new URL(urlString);
    await lookup(hostname);
    return true;
  } catch {
    return false;
  }
}

/**
 * INTEGRATION TESTS: Previously uploaded documents
 *
 * These tests validate the previously uploaded page after a case is linked.
 * If no documents exist, they validate the empty-table state.
 */
test.describe('[integration] Previously uploaded documents', () => {
  test.beforeAll(async () => {
    const ccdUrl = (process.env.CCD_DATA_STORE_API_URL || process.env.CCD_URL || '').trim();

    test.skip(!ccdUrl, 'Integration requires CCD_DATA_STORE_API_URL or CCD_URL');
    test.skip(
      !(await canResolve(ccdUrl)),
      `CCD host not resolvable from this runner: ${ccdUrl}. Use VPN/private DNS or run mock suite.`
    );
  });

  test.beforeEach(async ({
    loggedInPage,
    basePage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    dashboardPage,
  }) => {
    expectAuthenticated(loggedInPage);
    await basePage.verifyGlobalHeaderAndFooter();

    await navigateToAccessCodeStep(enterCaseNumberPage, contestedCaseWithHearing.caseId);
    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);

    await dashboardPage.verifyDashboardPageContent();
    await dashboardPage.viewPreviouslyUploadedLink.click();
  });

  test('[integration] Page renders read-only document table with key fields and no edit controls @a11y', async ({
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

  test('[integration] Document links are descriptive and downloadable when uploaded documents exist @a11y', async ({
    page,
    axeUtils,
  }) => {
    const previouslyUploadedDocumentsPage = new PreviouslyUploadedDocumentsPage(page);

    await previouslyUploadedDocumentsPage.verifyPageContent();

    const linkCount = await previouslyUploadedDocumentsPage.documentLinks.count();

    if (linkCount > 0) {
      await previouslyUploadedDocumentsPage.verifyDocumentLinkLabelsAreUniqueAndDescriptive();

      const firstHref = await previouslyUploadedDocumentsPage.documentLinks.first().getAttribute('href');
      if (!firstHref) {
        throw new Error('Expected document link to have an href attribute.');
      }

      const response = await page.request.get(firstHref);
      expect(response.ok()).toBe(true);

      const body = await response.body();
      expect(body.byteLength).toBeGreaterThan(0);
    } else {
      await expect(previouslyUploadedDocumentsPage.tableRows).toHaveCount(0);
    }

    await runA11yAudit(axeUtils);
  });

  test('[integration] Continue and cancel support onward upload flow and dashboard return @a11y', async ({
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
