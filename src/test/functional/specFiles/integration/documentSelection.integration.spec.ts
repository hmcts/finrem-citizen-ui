import { expect, test } from '../../../fixtures/fixtures';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';
import { navigateToFdrStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

/**
 * INTEGRATION TESTS: Document selection step
 *
 * This suite verifies document-type selection behavior within the upload
 * journey, including content, add/remove flows, validation, navigation,
 * and progression to upload documents.
 *
 * Setup:
 * - Uses authenticated `loggedInPage` fixture (real IDAM login flow)
 * - Navigates via shared helper: dashboard -> before-you-start -> confidentiality -> FDR
 * - Moves from FDR to document selection by selecting Yes
 *
 * Runs on:
 * - Environments with working authentication/session support
 */
test.describe('[integration] Document selection page', () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    enterAccessCodePage,
    contestedCaseWithHearing,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
    fdrPage,
    documentSelectionPage,
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);

    await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
    await fdrPage.selectYesAndContinue();
    await expect(documentSelectionPage.page).toHaveURL(/\/upload\/document-type-selection/);
    await expect(documentSelectionPage.pageHeader).toBeVisible();
  });

  test('[integration] Document selection supports adding a document @a11y', async ({
    documentSelectionPage,
    axeUtils,
  }) => {
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.expectDocumentsListContains(['Payslips']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection supports adding multiple documents @a11y', async ({
    documentSelectionPage,
    axeUtils,
  }) => {
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.addDocumentBySearchTerm('bank', 'Bank statements');
    await documentSelectionPage.expectDocumentsListContains(['Payslips', 'Bank statements']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection excludes already selected type from autocomplete results @a11y', async ({
    documentSelectionPage,
    axeUtils,
  }) => {
    const selectedLabel = 'Payslips';
    const searchTerm = 'payslip';

    await documentSelectionPage.addDocumentBySearchTerm(searchTerm, selectedLabel);
    await documentSelectionPage.expectDocumentsListContains([selectedLabel]);

    const autocompleteResponsePromise = documentSelectionPage.page.waitForResponse(response => {
      return response.url().includes('/autocomplete')
        && response.url().includes(`q=${encodeURIComponent(searchTerm)}`)
        && response.ok();
    });

    await documentSelectionPage.documentTypeInput.fill('');
    await documentSelectionPage.documentTypeInput.pressSequentially(searchTerm);
    await autocompleteResponsePromise;

    await expect(
      documentSelectionPage.page.getByRole('option', { name: selectedLabel })
    ).toHaveCount(0);

    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection supports removing a document @a11y', async ({
    documentSelectionPage,
    axeUtils,
  }) => {
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.addDocumentBySearchTerm('bank', 'Bank statements');

    await documentSelectionPage.removeDocumentByLabel('Payslips');
    await documentSelectionPage.page.waitForLoadState('networkidle');
    await documentSelectionPage.expectDocumentsListContains(['Bank statements']);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection requires at least one document before continuing @a11y', async ({
    documentSelectionPage,
    axeUtils,
  }) => {
    await documentSelectionPage.submitWithoutDocumentsAndExpectValidationError();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection continue navigates to upload documents after adding documents @a11y', async ({
    documentSelectionPage,
    axeUtils,
  }) => {
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');
    await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection getting help panel shows expected contact details @a11y', async ({
    documentSelectionPage,
    axeUtils,
  }) => {
    await expect(documentSelectionPage.gettingHelp.summary).toContainText(/contact us for help/i);
    await documentSelectionPage.verifyGettingHelpSection();
    await expect(documentSelectionPage.gettingHelp.callChargesLink).toHaveText(
      'Find out about call charges (opens in new tab)'
    );
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document selection back navigation returns to FDR and retains selected documents @a11y', async ({
    documentSelectionPage,
    axeUtils,
  }) => {
    await documentSelectionPage.addDocumentBySearchTerm('payslip', 'Payslips');

    await documentSelectionPage.clickBackToFdrAndReturnWithYesSelection();
    await documentSelectionPage.expectDocumentsListContains(['Payslips']);
    await runA11yAudit(axeUtils);
  });
});
