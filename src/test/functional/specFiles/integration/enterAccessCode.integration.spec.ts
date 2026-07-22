import dns from 'node:dns/promises';

import { test } from '../../../fixtures/fixtures';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import { expectAuthenticated, runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToAccessCodeStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

function getRequiredCcdUrl(): string {
  const ccd = process.env.CCD_URL?.trim() || process.env.CCD_DATA_STORE_API_URL?.trim();
  if (!ccd) {
    throw new Error('[integration-preflight] Set CCD_URL (or CCD_DATA_STORE_API_URL fallback)');
  }

  return ccd;
}

async function assertResolvableUrl(urlValue: string, label: string): Promise<void> {
  const host = new URL(urlValue).hostname;
  try {
    await dns.lookup(host);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[integration-preflight] ${label} host is not resolvable: ${host}. ` +
      `Check environment URL and network/DNS access. Original error: ${message}`
    );
  }
}

// Call once in fixture before creating CCD case
export async function assertIntegrationPreflight(): Promise<void> {
  const ccdDataStoreUrl = getRequiredCcdUrl();
  await assertResolvableUrl(ccdDataStoreUrl, 'CCD URL');
}

/**
 * INTEGRATION TESTS: Enter Access Code
 * 
 * These tests exercise the CCD-backed journey path:
 * case number submission -> access code submission -> dashboard.
 * They call invalidateAccessCode() which triggers real CCD events.
 * In local mock runs, fixture data is mock-seeded; in shared envs, cases are created/progressed via APIs.
 * 
 * Runs on: preview/AAT/perftest/ITHC by default, plus local when mock CCD is configured.
 * Default: skipped on demo; local runs require CCD_URL/CCD_DATA_STORE_API_URL -> http://localhost:4100.
 * ACCESS_CODE_REAL_INTEGRATION=false is treated as legacy local default and
 * does not disable known real-CCD targets.
 */

// INTEGRATION: Happy-path submission calls invalidateAccessCode(), which triggers
// a CCD event. These tests require a real case + real access-code integration.
if (shouldRunRealCcdIntegrationSuite()) {
  const isLocalMockCcd = /https?:\/\/(localhost|127\.0\.0\.1):4100\b/i.test(
    (process.env.CCD_URL || process.env.CCD_DATA_STORE_API_URL || '').trim()
  );

  test.describe('[integration-happy-path] Enter Access Code - Happy Path', () => {
    if (isLocalMockCcd) {
      test.use({ useMockTestSupport: true });
    }

    test.beforeEach(async ({
      loggedInPage,
      basePage,
      enterCaseNumberPage,
      enterAccessCodePage,
      contestedCaseWithHearing,
    }) => {
      expectAuthenticated(loggedInPage);

      // Reset local mock state so access code is fresh per test.
      if (isLocalMockCcd) {
        await basePage.injectCaseSession(
          contestedCaseWithHearing.caseId,
          contestedCaseWithHearing.applicantAccessCode,
          contestedCaseWithHearing.respondentAccessCode
        );
      } else {
        await navigateToAccessCodeStep(enterCaseNumberPage, contestedCaseWithHearing.caseId);
      }

      await basePage.verifyGlobalHeaderAndFooter();
      await enterAccessCodePage.verifyAccessCodePageContent();
    });
    /**
     * Citizen successfully enters valid applicant access code and views case.
     * [integration-happy-path] Requires real CCD-backed invalidation flow.
     */
    test('[integration-happy-path] Citizen can enter valid applicant access code and view case summary @a11y', async ({
      loggedInPage,
      dashboardPage,
      enterAccessCodePage,
      contestedCaseWithHearing,
      axeUtils,
    }) => {
      expectAuthenticated(loggedInPage);
      const accessCode = contestedCaseWithHearing.applicantAccessCode;

      await enterAccessCodePage.submitAccessCode(accessCode);
      await dashboardPage.verifyDashboardPageContent();
      await runA11yAudit(axeUtils);
    });

    /**
     * Verify whitespace is trimmed from access code.
     * [integration-happy-path] Requires real CCD-backed invalidation flow.
     */
    test('[integration-happy-path] Success: Access code with leading/trailing whitespace is accepted @a11y', async ({
      loggedInPage,
      dashboardPage,
      enterAccessCodePage,
      contestedCaseWithHearing,
      axeUtils,
    }) => {
      expectAuthenticated(loggedInPage);
      const accessCode = contestedCaseWithHearing.applicantAccessCode;

      await enterAccessCodePage.submitAccessCode(`  ${accessCode}  `);
      await dashboardPage.verifyDashboardPageContent();
      await runA11yAudit(axeUtils);
    });

    /**
     * Citizen successfully enters valid respondent access code and views case.
     * [integration-happy-path] Requires real CCD-backed invalidation flow.
     */
    test('[integration-happy-path] Citizen can enter valid respondent access code and view case summary @a11y', async ({
      loggedInPage,
      dashboardPage,
      enterAccessCodePage,
      contestedCaseWithHearing,
      axeUtils,
    }) => {
      expectAuthenticated(loggedInPage);
      const accessCode = contestedCaseWithHearing.respondentAccessCode;

      await enterAccessCodePage.submitAccessCode(accessCode);
      await dashboardPage.verifyDashboardPageContent();
      await runA11yAudit(axeUtils);
    });

    /**
     * Access codes are case-insensitive.
     * [integration-happy-path] Requires real CCD-backed invalidation flow.
     */
    test('[integration-happy-path] Access code submission is case-insensitive @a11y', async ({
      loggedInPage,
      dashboardPage,
      enterAccessCodePage,
      contestedCaseWithHearing,
      axeUtils,
    }) => {
      expectAuthenticated(loggedInPage);
      const accessCode = contestedCaseWithHearing.applicantAccessCode;

      // Enter access code in lowercase
      const lowercaseCode = accessCode.toLowerCase();

      await enterAccessCodePage.submitAccessCode(lowercaseCode);

      await dashboardPage.verifyDashboardPageContent();
      await runA11yAudit(axeUtils);
    });
  });
}

if (shouldRunRealCcdIntegrationSuite()) {
  const isLocalMockCcd = /https?:\/\/(localhost|127\.0\.0\.1):4100\b/i.test(
    (process.env.CCD_URL || process.env.CCD_DATA_STORE_API_URL || '').trim()
  );

  test.describe('[integration-happy-path] Enter Access Code - Full Journey', () => {
    if (isLocalMockCcd) {
      test.use({ useMockTestSupport: true });
    }

  test.beforeAll(async () => {
    await assertIntegrationPreflight();
  });

  test('[integration-happy-path] Citizen can submit applicant access code without pre-injection @integration @a11y', async ({
    loggedInPage,
    basePage,
    enterCaseNumberPage,
    contestedCaseWithHearing,
    enterAccessCodePage,
    dashboardPage,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);

    // Local mock mode needs session reseed so reused access code state does not leak between tests.
    if (isLocalMockCcd) {
      await basePage.injectCaseSession(
        contestedCaseWithHearing.caseId,
        contestedCaseWithHearing.applicantAccessCode,
        contestedCaseWithHearing.respondentAccessCode
      );
    } else {
      await navigateToAccessCodeStep(enterCaseNumberPage, contestedCaseWithHearing.caseId);
    }

    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();
    await runA11yAudit(axeUtils);
  });
  });
}
