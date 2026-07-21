import { test } from '../../../fixtures/fixtures';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToConfidentialityStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Confidentiality Page
 * 
 * These tests verify the confidentiality/redaction guidance page in the upload journey.
 * They rely on authenticated sessions and navigation through the standard upload flow.
 * 
 * Runs on: Environments with working authentication flow
 */

if (shouldRunRealCcdIntegrationSuite()) {
  test.describe('[integration] Confidentiality page', () => {
    test.beforeEach(async ({
      loggedInPage: _loggedInPage,
      enterCaseNumberPage,
      enterAccessCodePage,
      contestedCaseWithHearing,
      dashboardPage,
      beforeYouStartPage,
      basePage,
    }) => {
      await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
      await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);

      await navigateToConfidentialityStep(dashboardPage, beforeYouStartPage, basePage);
    });
 
  // AC1: Page renders with correct URL and key layout elements
  test('[integration] Confidentiality page content is visible and accessible @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialityPageContent();
    await runA11yAudit(axeUtils);
  });
 
  // AC2: Form C8 link is present with the correct href and opens in a new tab
  test('[integration] Form C8 link is present and correctly configured @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyFormC8Link();
    await runA11yAudit(axeUtils);
  });
 
  // AC3: Redaction instructions are shown
  test('[integration] Redaction instructions are displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyRedactionInstructions();
    await runA11yAudit(axeUtils);
  });
 
  // AC4: Court staff disclaimer is shown
  test('[integration] Court staff disclaimer is displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyCourtStaffDisclaimer();
    await runA11yAudit(axeUtils);
  });
 
  // AC5: Confidential information examples and do-not-redact guidance are shown
  test('[integration] Confidential information examples are displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyConfidentialInformationExamples();
    await runA11yAudit(axeUtils);
  });
 
  // AC6: Warning message about documents being placed on the court record is shown
  test('[integration] Court record warning message is displayed @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyCourtRecordWarning();
    await runA11yAudit(axeUtils);
  });
 
  // AC7: Continue button is visible, enabled, and navigates to the FDR step
  test('[integration] Continue button navigates to FDR step @a11y', async ({
    confidentialityPage,
    fdrPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyContinueButton();
    await confidentialityPage.clickContinueAndExpectFdrStep();
    await fdrPage.verifyFdrPageContent();
    await runA11yAudit(axeUtils);
  });
 
  // AC8: Getting help panel is collapsed by default and expands with correct contact details
  test('[integration] Getting help panel is closed by default and shows contact details when expanded @a11y', async ({
    confidentialityPage,
    axeUtils,
  }) => {
    await confidentialityPage.verifyGettingHelpSection();
    await runA11yAudit(axeUtils);
  });
  });
}
