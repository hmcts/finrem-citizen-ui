import { DEFAULT_AXE_OPTIONS, expect, test } from '../../../fixtures/fixtures';

/**
 * MOCK-ONLY TESTS: Enter Access Code
 * 
 * These tests use /__test/inject-case-session with static values to verify
 * page content and validation logic without requiring CCD integration.
 * 
 * Runs on: Local environment only
 * Requires: Mock CCD server (localhost:4100), test-support routes enabled
 * Does NOT run on: Preview, AAT (test-support routes disabled)
 */

// MOCK-ONLY: This describe uses /__test/inject-case-session with static values.
// It does not create CCD cases or call external case-creation APIs.
test.describe('[mock] Enter Access Code - Page Content', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    page,
    basePage,
  }) => {
    await basePage.injectCaseSession('1234567890123456', 'APPCODE1', 'RSPCODE1');
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await basePage.verifyGlobalHeaderAndFooter();
  });

  // MOCK-ONLY: Verifies static page content using injected session data.
  test('[mock] Access code page contains all required elements @a11y', async ({
    enterAccessCodePage,
    assertionHelpers: _assertionHelpers,
    axeUtils,
  }) => {
    await enterAccessCodePage.verifyAccessCodePageContent();
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });
});

// MOCK-ONLY: Validation tests run against injected mock session data.
// They are isolated from live CCD/network dependencies.
test.describe('[mock] Enter Access Code - Validation Errors', () => {
  test.use({ useMockTestSupport: true });

  test.beforeEach(async ({
    loggedInPage: _loggedInPage,
    page,
    basePage,
  }) => {
    await basePage.injectCaseSession('1234567890123456', 'APPCODE1', 'RSPCODE1');
    await expect(page).toHaveURL(/\/enter-access-code$/);
    await basePage.verifyGlobalHeaderAndFooter();
  });

  /**
   * MOCK-ONLY: Verify empty access code input validation.
   */
  test('[mock] Error: Access code is empty @a11y', async ({
    enterAccessCodePage,
    assertionHelpers: _assertionHelpers,
    page: _page,
    axeUtils,
  }) => {
    // Submit without entering access code
    await enterAccessCodePage.continueBtn.click();

    await enterAccessCodePage.expectValidationError('Enter your access code');
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  /**
   * MOCK-ONLY: Verify access code length validation (too short).
   */
  test('[mock] Error: Access code is too short @a11y', async ({
    enterAccessCodePage,
    page: _page,
    axeUtils,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC123');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  /**
   * MOCK-ONLY: Verify access code length validation (too long).
   */
  test('[mock] Error: Access code is too long @a11y', async ({
    enterAccessCodePage,
    page: _page,
    axeUtils,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABCDEF1234');

    await enterAccessCodePage.expectValidationError('Access code must be 8 characters');
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  /**
   * MOCK-ONLY: Verify access code format validation (special characters not allowed).
   */
  test('[mock] Error: Access code contains invalid characters @a11y', async ({
    enterAccessCodePage,
    page: _page,
    axeUtils,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC-1234');

    await enterAccessCodePage.expectValidationError(
      'Access code must only include letters a-z, and numbers 0-9'
    );
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  /**
   * MOCK-ONLY: Verify access code format validation (spaces not allowed).
   */
  test('[mock] Error: Access code contains spaces @a11y', async ({
    enterAccessCodePage,
    page: _page,
    axeUtils,
  }) => {
    await enterAccessCodePage.submitAccessCode('ABC 1234');

    await enterAccessCodePage.expectValidationError(
      'Access code must only include letters a-z, and numbers 0-9'
    );
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

  /**
   * MOCK-ONLY: Verify invalid access code not found in injected case data.
   */
  test('[mock] Error: Access code not found in case @a11y', async ({
    enterAccessCodePage,
    page: _page,
    axeUtils,
  }) => {
    // Submit a valid format code that doesn't match any code on the case
    await enterAccessCodePage.submitAccessCode('XXXXXXXX');

    await enterAccessCodePage.expectValidationError(
      'Access code does not match case number'
    );
    await axeUtils.audit(DEFAULT_AXE_OPTIONS);
  });

});
