import { test } from '../../../fixtures/fixtures';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToFdrStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Financial Dispute Resolution (FDR) step
 *
 * FDR = Financial Dispute Resolution. This suite verifies the real upload
 * journey behavior for the FDR question page, including content, validation,
 * navigation, and getting-help support.
 *
 * Setup:
 * - Uses authenticated `loggedInPage` fixture (real IDAM login flow)
 * - Navigates via shared helper: dashboard -> before-you-start -> confidentiality -> FDR
 *
 * Runs on:
 * - Environments with working authentication/session support
 */
if (shouldRunRealCcdIntegrationSuite()) {
  test.describe('[integration] FDR page', () => {
    // Run serially to avoid concurrent logins overwhelming the AAT pod.
    test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);

    await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
  });

  test('[integration] FDR page content is visible and accessible @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.verifyFdrPageContent();
    await runA11yAudit(axeUtils);
  });

  test('[integration] FDR requires hearing selection before continuing @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.submitWithoutSelectionAndExpectValidationError();
    await runA11yAudit(axeUtils);
  });

  test('[integration] FDR yes selection navigates to document selection @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.verifyDocumentSelectionPageContent('/upload/fdr');
    await runA11yAudit(axeUtils);
  });

  test('[integration] FDR getting help panel shows expected contact details @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.verifyGettingHelpSection();
    await runA11yAudit(axeUtils);
  });
  });
}
