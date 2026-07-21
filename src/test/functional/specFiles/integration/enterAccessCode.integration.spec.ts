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
 * These tests use the real CCD path only:
 * case number submission -> access code submission -> dashboard.
 * They call invalidateAccessCode() which triggers real CCD events.
 * They require a real contested case created via API and progressed through
 * FR_issueApplication (the point where access codes are generated).
 * 
 * Runs on: AAT/preview by default (or any target when ACCESS_CODE_REAL_INTEGRATION=true)
 * Requires: Real CCD instance reachable, valid case with real access codes
 * Default: Skipped outside preview/AAT unless ACCESS_CODE_REAL_INTEGRATION=true.
 * ACCESS_CODE_REAL_INTEGRATION=false is treated as legacy local default and
 * does not disable AAT/preview happy-path runs.
 */

// INTEGRATION: Happy-path submission calls invalidateAccessCode(), which triggers
// a CCD event. These tests require a real case + real access-code integration.
if (shouldRunRealCcdIntegrationSuite()) {
  test.describe('[integration-happy-path] Enter Access Code - Happy Path', () => {

  test.beforeAll(async () => {
    await assertIntegrationPreflight(); // keeps DNS/resolvability validation
  });

  test.beforeEach(async ({
    loggedInPage,
    basePage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
  }) => {
    expectAuthenticated(loggedInPage);
    await basePage.verifyGlobalHeaderAndFooter();
    await navigateToAccessCodeStep(enterCaseNumberPage, contestedCaseWithHearing.caseId);
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
  test.describe('[integration-happy-path] Enter Access Code - Full Journey', () => {

  test.beforeAll(async () => {
    await assertIntegrationPreflight();
  });

  test('[integration-happy-path] Citizen can submit applicant access code without pre-injection @integration @a11y', async ({
    loggedInPage,
    enterCaseNumberPage,
    contestedCaseWithHearing,
    enterAccessCodePage,
    dashboardPage,
    axeUtils,
  }) => {
    expectAuthenticated(loggedInPage);
    await navigateToAccessCodeStep(enterCaseNumberPage, contestedCaseWithHearing.caseId);

    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
    await dashboardPage.verifyDashboardPageContent();
    await runA11yAudit(axeUtils);
  });
  });
}
