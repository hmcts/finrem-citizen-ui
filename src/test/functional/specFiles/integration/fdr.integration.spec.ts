import { DEFAULT_AXE_OPTIONS, test } from '../../../fixtures/fixtures';
import { navigateToFdrStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Financial Dispute Resolution (FDR) step
 *
 * FDR = Financial Dispute Resolution. This suite verifies the real upload
 * journey behavior for the FDR question page, including content, validation,
 * navigation, and progression to document selection.
 *
 * Setup:
 * - Uses authenticated `loggedInPage` fixture (real IDAM login flow)
 * - Navigates via shared helper: dashboard -> before-you-start -> confidentiality -> FDR
 *
 * Runs on:
 * - Environments with working authentication/session support
 */
test.describe('[integration] FDR page', () => {
  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
  }) => {
    await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
  });

  test('[integration] FDR page content is visible and accessible @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.verifyFdrPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] FDR requires hearing selection before continuing @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.submitWithoutSelectionAndExpectValidationError();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] FDR yes selection navigates to document selection @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.verifyDocumentSelectionPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] Document selection page is visible and accessible @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.verifyDocumentSelectionPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] FDR no selection navigates to document selection @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectNoAndContinue();
    await documentSelectionPage.verifyDocumentSelectionPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] FDR cancel returns to dashboard @a11y', async ({
    fdrPage,
    dashboardPage,
    axeUtils,
  }) => {
    await fdrPage.clickCancelAndExpectDashboard();
    await dashboardPage.verifyDashboardPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] Document selection supports back and continue behavior @a11y', async ({
    fdrPage,
    documentSelectionPage,
    axeUtils,
  }) => {
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.verifyDocumentSelectionPageContent();

    await documentSelectionPage.clickBackAndExpectFdr();
    await fdrPage.verifyFdrPageContent();

    await fdrPage.selectNoAndContinue();
    await documentSelectionPage.clickContinue();
    await documentSelectionPage.verifyDocumentSelectionPageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  test('[integration] FDR getting help panel shows expected contact details @a11y', async ({
    fdrPage,
    axeUtils,
  }) => {
    await fdrPage.verifyGettingHelpSection();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});
