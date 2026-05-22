import { test } from '../../../fixtures/fixtures';
import { runA11yAudit } from '../journeyHelpers/specAssertions.helper';

/**
 * INTEGRATION FOLDER TESTS: Enter Case Number Validation
 *
 * These tests validate input and error handling without creating real CCD cases.
 *
 * Why they run on preview/AAT:
 * - They do NOT call /__test/inject-case-session.
 * - They do NOT require local mock-case-api seeded data.
 * - They submit invalid or non-existent case numbers and assert UI validation/errors.
 *
 * Are they integration tests?
 * - Not full happy-path integration tests (no real case creation/linking).
 * - They are UI validation tests that can run against any environment with login available.
 */

const dataFactory = {
  generateDigits: (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join(''),
};

test.describe('[integration] Enter Case Number Page Verification - Validation Errors', () => {
  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    enterCaseNumberPage,
    basePage,
  }) => {
    await enterCaseNumberPage.verifyCaseNumberPageContent();
    await basePage.verifyGlobalHeaderAndFooter();
  });

  test('[integration] Error: Empty input @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber('');
    await enterCaseNumberPage.expectValidationError('Enter your case number');
    await runA11yAudit(axeUtils);
  });

  test('[integration] Error: Boundary check - 15 characters (Lower Boundary - 1) @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(15));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
    await runA11yAudit(axeUtils);
  });

  test('[integration] Error: Boundary check - 21 characters (Upper Boundary + 1) @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(21));
    await enterCaseNumberPage.expectValidationError('Case number must be between 16 and 20 characters');
    await runA11yAudit(axeUtils);
  });

  test('[integration] Error: Invalid format - Letters @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber('1234-5678-ABCD-EFGH');
    await enterCaseNumberPage.expectValidationError(
      'Case number must only include numbers 0 to 9 and special characters such as hyphens'
    );
    await runA11yAudit(axeUtils);
  });

  test('[integration] Error: Case number not found @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber('9999999999999999');
    await enterCaseNumberPage.expectValidationError(
      'We cannot find that case number, Enter the case number that you received from the court'
    );
    await runA11yAudit(axeUtils);
  });

  test('[integration] Success Logic: 20 digits (Upper Boundary) @a11y', async ({ enterCaseNumberPage, axeUtils }) => {
    await enterCaseNumberPage.submitCaseNumber(dataFactory.generateDigits(20));

    // Confirm that the length-specific validation is NOT triggered
    await enterCaseNumberPage.expectNoSpecificValidationErrors(['Case number must be between 16 and 20 characters']);

    // We expect the "Not Found" error because this random 20-digit ID doesn't exist in DB
    await enterCaseNumberPage.expectValidationError('Case number must be 16 digits');
    await runA11yAudit(axeUtils);
  });
});
