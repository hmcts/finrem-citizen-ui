import { expect, test } from '../../../fixtures/fixtures';
import type { DocumentUploadPage } from '../../pom/documentUploadPage.page';
import { shouldRunRealCcdIntegrationSuite } from '../journeyHelpers/integrationTarget.helper';
import {
  assertNoFilesValidationError,
  assertUploadedFileVisible,
  assertUploadPageCoreContent,
  runA11yAudit,
} from '../journeyHelpers/specAssertions.helper';
import { navigateToFdrStep } from '../journeyHelpers/uploadJourneyNavigation.helper';

type UploadScenario = {
  label: string;
  upload: (page: DocumentUploadPage) => Promise<void>;
  expectedFilename: string;
};

type RenameScenario = {
  label: string;
  searchTerm: string;
  typeValue: string;
  renameToken: string;
};

const uploadScenarios: UploadScenario[] = [
  {
    label: 'docx',
    upload: async page => page.chooseFileAndUploadDocx(),
    expectedFilename: 'testDocument.docx',
  },
  {
    label: 'jpg',
    upload: async page => page.chooseFileAndUploadJpg(),
    expectedFilename: 'testDocument.jpg',
  },
  {
    label: 'png',
    upload: async page => page.chooseFileAndUploadPng(),
    expectedFilename: 'testDocument.png',
  },
  {
    label: 'pdf',
    upload: async page => page.chooseFileAndUploadPdf(),
    expectedFilename: 'testDocument.pdf',
  },
  {
    label: 'xlsx',
    upload: async page => page.chooseFileAndUploadXlsx(),
    expectedFilename: 'testDocument.xlsx',
  },
] as const;

const renameScenarios: RenameScenario[] = [
  {
    label: 'Chronology',
    searchTerm: 'chronology',
    typeValue: 'chronology',
    renameToken: 'Chronology',
  },
  {
    label: 'Family Mediation Information and Assessment Meeting (MIAM) Form: Form FM1',
    searchTerm: 'miam',
    typeValue: 'family-mediation-information-and-assessment-meeting-miam-form-form-fm1',
    renameToken: 'FormFM1',
  },
  {
    label: 'Statement of costs (summary assessment): Form N260',
    searchTerm: 'n260',
    typeValue: 'statement-of-costs-summary-assessment-form-n260',
    renameToken: 'N260',
  },
  {
    label: 'Housing needs / property particulars',
    searchTerm: 'housing needs',
    typeValue: 'housing-needs-property-particulars',
    renameToken: 'Property-Particulars',
  },
  {
    label: 'Attachments to Form E',
    // Autocomplete requires a direct label/alias substring match; otherwise it falls back to "Other document".
    searchTerm: 'attachments to form e',
    typeValue: 'attachments-to-form-e',
    renameToken: 'AttachmentsFormE',
  },
] as const;

/**
 * INTEGRATION TESTS: Document Upload step
 *
 * This suite verifies document upload behavior within the upload
 * journey, including adding/removing files by type, validation,
 * accessibility, getting help, and back navigation.
 *
 * Setup:
 * - Uses authenticated `loggedInPage` fixture (real IDAM login flow)
 * - Navigates via shared helper: dashboard -> before-you-start -> confidentiality -> FDR -> document selection
 * - Selects "Other document" on document selection page and continues to upload page
 *
 * Runs on:
 * - Environments with working authentication/session support
 */
if (shouldRunRealCcdIntegrationSuite()) {
  test.describe('[integration] Document upload page', () => {
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
    documentUploadPage,
  }) => {
    await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
    await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);

    await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addOtherDocumentAndContinue();
    // Verify page content
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/upload-documents/);
    await expect(documentUploadPage.pageHeader).toBeVisible();
  });

  test('[integration] Upload your documents page displays expected content and layout @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await assertUploadPageCoreContent(documentUploadPage);
    await expect(documentUploadPage.uploadSectionHeadings).toHaveCount(1);
    await runA11yAudit(axeUtils);
  });

  for (const scenario of uploadScenarios) {
    test(`[integration] Document upload supports adding an uploaded ${scenario.label} file @a11y`, async ({
      documentUploadPage,
      axeUtils,
    }) => {
      await scenario.upload(documentUploadPage);
      await assertUploadedFileVisible(documentUploadPage, scenario.expectedFilename);
      await runA11yAudit(axeUtils);
    });
  }

  test('[integration] Document upload supports adding multiple uploaded files @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.chooseFileAndUploadDocx();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(2);
    await assertUploadedFileVisible(documentUploadPage, 'testDocument.docx');
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload supports removing an uploaded file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.chooseFileAndUploadDocx();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(2);
    await documentUploadPage.removeUploadedFile();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(1);
    await assertUploadedFileVisible(documentUploadPage, 'testDocument.docx');
    await runA11yAudit(axeUtils);
  });

  test('[integration] Continue after uploading documents navigates to check-upload @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.clickContinue();
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/check-upload/);
    await expect(documentUploadPage.page.getByRole('heading', { name: 'Check your uploaded documents' })).toBeVisible();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload displays rename instruction and renames file for supported document types (Chronology) @a11y', async ({
    loggedInPage: _loggedInPage,
    dashboardPage,
    beforeYouStartPage,
    confidentialityPage,
    basePage,
    fdrPage,
    documentSelectionPage,
    documentUploadPage,
    axeUtils,
  }) => {
    // Navigate and select a renaming document type (Chronology)
    await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
    await fdrPage.selectYesAndContinue();
    await documentSelectionPage.addChronologyAndContinue();
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/upload-documents/);
    await expect(documentUploadPage.pageHeader).toBeVisible();

    // Verify rename instruction text appears for renaming document types
    const renameInstruction = documentUploadPage.page.getByText(/automatically be renamed to.*-DD-MM-YYYY/);
    await expect(renameInstruction).toBeVisible();

    // Upload file into Chronology section
    await documentUploadPage.chooseFileAndUploadChronologyDocx();

    // Verify file appears with renamed format
    const renamedFilePattern = /.*-Chronology-\d{2}-\d{2}-\d{4}\..+/;
    const renamedFile = documentUploadPage.page.locator('a.govuk-link:not([data-remove-file])').filter({
      hasText: renamedFilePattern,
    });
    await expect(renamedFile).toBeVisible();

    // Verify renamed file appears in the uploaded files list.
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(1);

    // Verify remove button is visible
    await expect(documentUploadPage.page.getByText('Remove document')).toBeVisible();

    await runA11yAudit(axeUtils);
  });

  for (const scenario of renameScenarios) {
    test(`[integration] Upload rename hint and filename format are correct for ${scenario.renameToken} @a11y`, async ({
      loggedInPage: _loggedInPage,
      dashboardPage,
      beforeYouStartPage,
      confidentialityPage,
      basePage,
      fdrPage,
      documentSelectionPage,
      documentUploadPage,
      axeUtils,
    }) => {
      await navigateToFdrStep(dashboardPage, beforeYouStartPage, confidentialityPage, basePage);
      await fdrPage.selectYesAndContinue();
      await documentSelectionPage.addDocumentBySearchTerm(scenario.searchTerm, scenario.label);
      await documentSelectionPage.clickContinueAndExpectUploadDocumentsStep();

      const renameInstruction = documentUploadPage.page.getByText(
        new RegExp(String.raw`automatically be renamed to\s+.*-${scenario.renameToken}-DD-MM-YYYY`)
      );
      await expect(renameInstruction).toBeVisible();

      await documentUploadPage.chooseFileAndUploadDocumentByTypeValue(scenario.typeValue);

      const renamedFile = documentUploadPage.uploadedFileLinks.filter({
        hasText: new RegExp(String.raw`-${scenario.renameToken}-\d{2}-\d{2}-\d{4}\..+`),
      });
      await expect(renamedFile).toHaveCount(1);

      await runA11yAudit(axeUtils);
    });
  }

  test('[integration] Document upload requires at least one uploaded file before continuing @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.clickContinue();
    await expect(documentUploadPage.errorSummaryTitle).toBeVisible();
    const errorLink = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');
    await expect(errorLink).toBeVisible();
    await expect(documentUploadPage.inlineNoFilesError).toBeVisible();
    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(0);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload requires correct file format before continuing @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    test.setTimeout(60_000); // a11y scans in integration can exceed 30s

    await documentUploadPage.uploadInvalidFileFormat();
    await documentUploadPage.clickContinue();
    await assertNoFilesValidationError(documentUploadPage);

    // extra stability guard before axe scan
    await expect(documentUploadPage.pageHeader).toBeVisible();
    await expect(documentUploadPage.errorSummaryTitle).toBeVisible();

    await runA11yAudit(axeUtils);
  });

  test('[integration] Document upload rejects empty files @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.uploadEmptyFile();

    // Integration behavior can vary between explicit "empty file" validation and
    // fallback "at least one file" validation when the empty selection is discarded.
    await documentUploadPage.clickContinue();
    const emptyFileError = documentUploadPage.getErrorSummaryLink('The selected file is empty');
    const inlineEmptyFileError = documentUploadPage.inlineEmptyFileError;
    const noFileError = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');

    // Prefer polling explicit outcomes over composing optional locators, which can be flaky in integration timing.
    let validationOutcome = 'none';
    await expect
      .poll(async () => {
        if (await emptyFileError.isVisible().catch(() => false)) {
          validationOutcome = 'empty-file-error';
          return validationOutcome;
        }
        if (await inlineEmptyFileError.isVisible().catch(() => false)) {
          validationOutcome = 'inline-empty-file-error';
          return validationOutcome;
        }
        if (await noFileError.isVisible().catch(() => false)) {
          validationOutcome = 'no-file-error';
          return validationOutcome;
        }
        validationOutcome = 'none';
        return validationOutcome;
      }, { timeout: 15_000 })
      .not.toBe('none');

    if (validationOutcome === 'no-file-error') {
      await assertNoFilesValidationError(documentUploadPage);
    }

    await expect(documentUploadPage.uploadedFileLinks).toHaveCount(0);
    await runA11yAudit(axeUtils);
  });

  test('[integration] Retry upload after validation failure succeeds and clears error @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.uploadInvalidFileFormat();

    // Keep retry flow deterministic across environments by asserting the stable
    // no-file validation state before re-uploading a valid document.
    await documentUploadPage.clickContinue();
    const noFileError = documentUploadPage.getErrorSummaryLink('You must upload at least one file before continuing');
    await assertNoFilesValidationError(documentUploadPage);

    await documentUploadPage.chooseFileAndUploadDocx();
    await assertUploadedFileVisible(documentUploadPage, 'testDocument.docx');
    await expect(noFileError).toHaveCount(0);
    await expect(documentUploadPage.inlineFormatError).toBeHidden();
    await runA11yAudit(axeUtils);
  });

  test('[integration] Upload documents selection getting help panel shows expected contact details @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.gettingHelp.verifySection({
      openingHoursLocator: documentUploadPage.helpOpeningHours,
      callChargesHref: 'https://www.gov.uk/call-charges',
    });
    await runA11yAudit(axeUtils);
  });

  test('[integration] Upload documents back navigation returns to document type selection and retains uploaded file @a11y', async ({
    documentUploadPage,
    axeUtils,
  }) => {
    await documentUploadPage.chooseFileAndUploadDocx();
    await documentUploadPage.clickBack();
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/document-type-selection/);
    await documentUploadPage.page.getByRole('button', { name: 'Continue' }).click();
    await expect(documentUploadPage.page).toHaveURL(/\/upload\/upload-documents/);
    await assertUploadedFileVisible(documentUploadPage, 'testDocument.docx');
    await runA11yAudit(axeUtils);
  });

  });
}
