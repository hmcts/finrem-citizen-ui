import { CaseType, ContestedEvents, PayloadPath } from '../../../config/case-data';
import { ReplacementAction } from '../../../types/replacement-action';
import { ContestedEventApi } from '../../api/contested/ContestedEventApi';
import { CaseDataBuilder } from '../../CaseDataBuilder';
import { DateHelper } from '../../DateHelper';
import {
  APPLICATION_ISSUE_DATE,
  DIRECTIONS_LIST_DATA,
  ESTIMATED_ASSETS_UNDER_1M,
  EXPRESS_PILOT_PARTICIPATING_COURT_REPLACEMENT,
  OUTCOME_LIST_DATA,
  REFER_LIST_DATA } from '../../PayloadMutator';
import { envTestData } from '../../test_data/EnvTestDataConfig';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const parseNumberEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const START_EVENT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 15000,
};

const ACCESS_CODE_RETRY_CONFIG = {
  caseCreationAttempts: parseNumberEnv(process.env.ACCESS_CODE_CASE_CREATION_ATTEMPTS, 1),
  // 0 = no attempt cap; poll until maxTotalRuntimeMs deadline is reached.
  codeFetchAttemptsPerCase: parseNumberEnv(process.env.ACCESS_CODE_FETCH_ATTEMPTS_PER_CASE, 0),
  manageHearingsReattemptsPerCase: parseNumberEnv(process.env.ACCESS_CODE_MANAGE_HEARINGS_REATTEMPTS, 0),
  initialDelayMs: parseNumberEnv(process.env.ACCESS_CODE_FETCH_INITIAL_DELAY_MS, 500),
  maxDelayMs: parseNumberEnv(process.env.ACCESS_CODE_FETCH_MAX_DELAY_MS, 2000),
  // Allow more time for FR_issueApplication propagation on shared AAT infrastructure.
  // Access-code fields can appear shortly after event success, not always immediately.
  maxTotalRuntimeMs: parseNumberEnv(process.env.ACCESS_CODE_MAX_TOTAL_RUNTIME_MS, 30000),
};

export class ManageHearingsInfraUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManageHearingsInfraUnavailableError';
  }
}

export class AccessCodeGenerationUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessCodeGenerationUnavailableError';
  }
}

/**
 * Factory for creating contested cases in various states
 */
export class ContestedCaseFactory {
  private static getCodeFetchAttemptsLabel(): string {
    return ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase > 0
      ? String(ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase)
      : 'timebox';
  }

  private static isCaseNotFoundError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('status 404')
      && (
        message.includes('No case found')
        || message.includes('CaseNotFoundException')
        || message.includes('Cannot find case for given criteria')
      )
    );
  }

  private static async tryFetchAccessCodesOnce(
    caseId: string,
    attempt: number
  ): Promise<{ applicantCode?: string; respondentCode?: string }> {
    try {
      const applicantCode = await ContestedEventApi.getApplicantAccessCode(caseId);
      const respondentCode = await ContestedEventApi.getRespondentAccessCode(caseId);
      return { applicantCode, respondentCode };
    } catch (error) {
      if (!this.isCaseNotFoundError(error)) {
        throw error;
      }

      // Transient case-read 404s are expected briefly in CCD after create/update;
      // continue polling until the timebox expires.
      // eslint-disable-next-line no-console
      console.info(
        `[Factory Poll] Case ${caseId} not yet readable for access codes (attempt ${attempt + 1}/${this.getCodeFetchAttemptsLabel()}).`
      );
      return {};
    }
  }

  private static isRetryableError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    // Retry on 404 (case not found), 5xx (server errors), 422 (state condition), timeouts
    return (
      this.isCaseNotFoundError(error) ||
      message.includes('status 5') ||
      (message.includes('status 422') && message.includes('Pre-state condition')) ||
      message.includes('timeout') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ECONNRESET')
    );
  }

  private static async pollUntilReady<T>(
    operation: () => Promise<T>,
    retryLabel: string
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= START_EVENT_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryableError(error) || attempt === START_EVENT_RETRY_CONFIG.maxRetries) {
          throw error;
        }

        const delayMs = Math.min(
          START_EVENT_RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
          START_EVENT_RETRY_CONFIG.maxDelayMs
        );

        const errorType = error instanceof Error ? error.message.split('\n')[0] : String(error);
        // eslint-disable-next-line no-console
        console.log(`[Factory Poll] ${retryLabel} transient error "${errorType}" (attempt ${attempt + 1}/${START_EVENT_RETRY_CONFIG.maxRetries + 1}), waiting ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }

    throw lastError;
  }

  private static async withCaseworkerStartEventRetry<T>(operation: () => Promise<T>): Promise<T> {
    return this.pollUntilReady(operation, 'Caseworker start-event');
  }

  private static async withSolicitorStartEventRetry<T>(operation: () => Promise<T>): Promise<T> {
    return this.pollUntilReady(operation, 'Solicitor start-event');
  }

  private static async buildContestedCase({
    isPaper,
    replacements = [],
    event,
    payloadPath
  }: {
    isPaper: boolean;
    replacements?: ReplacementAction[];
    event?: string;
    payloadPath?: string;
  }): Promise<string> {
    const derivedEvent =
      event ||
      (isPaper
        ? ContestedEvents.createPaperCase.ccdCallback
        : ContestedEvents.createCase.ccdCallback);

    const derivedPayloadPath =
      payloadPath ||
      (isPaper ? PayloadPath.Contested.paper : PayloadPath.Contested.formA);

    const builder = new CaseDataBuilder(CaseType.Contested, derivedEvent)
      [isPaper ? 'withCaseWorkerUser' : 'withSolicitorUser']()
      .withPayload(derivedPayloadPath);

    if (replacements.length) {
      builder.addReplacements(...replacements);
    }

    return builder.create();
  }

  // Base builders
  static async createBaseContestedFormA(): Promise<string> {
    // Don't add issueDate at creation - it's set by caseworker when issuing
    return this.buildContestedCase({
      isPaper: false,
      replacements: []
    });
  }

  static createBaseContestedPaperCase(): Promise<string> {
    return this.buildContestedCase({ isPaper: true });
  }

  static createSchedule1Case(): Promise<string> {
    return this.buildContestedCase({
      isPaper: false,
      payloadPath: PayloadPath.Contested.schedule1
    });
  }

  // Specialised variants
  static async createContestedFormACaseWithExpressPilotEnrolled(): Promise<string> {
    return this.buildContestedCase({
      isPaper: false,
      replacements: [
        ...EXPRESS_PILOT_PARTICIPATING_COURT_REPLACEMENT,
        ...APPLICATION_ISSUE_DATE(DateHelper.getCurrentDate())
      ]
    });
  }

  static createContestedPaperCaseWithExpressPilotEnrolled(): Promise<string> {
    return this.buildContestedCase({
      isPaper: true,
      replacements: EXPRESS_PILOT_PARTICIPATING_COURT_REPLACEMENT
    });
  }

  static createContestedPaperCaseWithEstimatedAssetUnder1M(): Promise<string> {
    return this.buildContestedCase({
      isPaper: true,
      replacements: [
        ...EXPRESS_PILOT_PARTICIPATING_COURT_REPLACEMENT,
        ...ESTIMATED_ASSETS_UNDER_1M
      ]
    });
  }

  // Reusable helper for creating cases
  private static async createCase(
    isExpressPilot: boolean,
    isPaper: boolean
  ): Promise<string> {
    if (isExpressPilot) {
      return isPaper
        ? this.createContestedPaperCaseWithExpressPilotEnrolled()
        : this.createContestedFormACaseWithExpressPilotEnrolled();
    }
    return isPaper
      ? this.createBaseContestedPaperCase()
      : this.createBaseContestedFormA();
  }

  // Workflow helpers - these create and progress cases
  
  /**
   * Create and submit a Form A case
   */
  static async createAndProcessFormACase(): Promise<string> {
    const caseId = await this.createBaseContestedFormA();
    await ContestedEventApi.solicitorSubmitFormACase(caseId);
    return caseId;
  }

  /**
   * Create Form A case and progress to listing (ready for hearing)
   */
  static async createAndProcessFormACaseUpToProgressToListing(
    isExpressPilot = false,
    issueDate?: string
  ): Promise<string> {
    const caseId = await this.pollUntilReady(
      () => this.createCase(isExpressPilot, false),
      'Form A case creation'
    );

    // Poll until the solicitor start-event token is available instead of fixed sleeps.
    await this.withSolicitorStartEventRetry(async () => {
      await ContestedEventApi.solicitorSubmitFormACase(caseId);
    });

    // Replace fixed waits with targeted retry for eventual consistency on caseworker start-events.
    await this.withCaseworkerStartEventRetry(async () => {
      await ContestedEventApi.caseWorkerProgressFormACaseToListing(caseId, issueDate);
    });

    return caseId;
  }

  /**
   * Create paper case and progress to listing
   */
  static async createAndProcessPaperCaseUpToProgressToListing(
    isExpressPilot = false,
    issueDate?: string
  ): Promise<string> {
    const caseId = await this.pollUntilReady(
      () => this.createCase(isExpressPilot, true),
      'Paper case creation'
    );

    // Replace fixed waits with targeted retry for eventual consistency on caseworker start-events.
    await this.withCaseworkerStartEventRetry(async () => {
      await ContestedEventApi.caseWorkerProgressPaperCaseToListing(caseId, issueDate);
    });

    return caseId;
  }

  /**
   * Create contested case with hearing date scheduled
    * This progresses a case to listing with a hearing added.
    * Access codes are generated at FR_issueApplication.
   */
  static async createContestedCaseWithHearing(): Promise<string> {
    // Must provide issue date for issueApplication event
    const issueDate = DateHelper.getCurrentDate();
    const caseId = await this.createAndProcessFormACaseUpToIssueApplication(false, issueDate);

    // Manage hearings event is used here to add a hearing after listing.
    try {
      await this.withCaseworkerStartEventRetry(async () => {
        await ContestedEventApi.caseWorkerPerformsAddAHearing(caseId);
      });
      // eslint-disable-next-line no-console
      console.info(`✓ Case ${caseId} created and progressed to listing with hearing added`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isManageHearingsCallbackFailure =
        message.includes('FR_manageHearings')
        && message.includes('Callback to service has been unsuccessful')
        && message.includes('status 502');

      if (!isManageHearingsCallbackFailure) {
        throw error;
      }

      // eslint-disable-next-line no-console
      console.warn(
        `⚠ FR_manageHearings callback failed (502); case ${caseId} is listing-ready but may lack access codes`
      );

      // Fail fast on known infra callback failure; outer flow decides whether to retry with a fresh case.
      throw new ManageHearingsInfraUnavailableError(
        `FR_manageHearings callback failed (502) for case ${caseId}`
      );
    }

    return caseId;
  }

  private static async waitForAccessCodes(
    caseId: string,
    deadlineEpochMs: number
  ): Promise<{ applicantCode: string; respondentCode: string } | undefined> {
    for (
      let attempt = 0;
      Date.now() < deadlineEpochMs
      && (
        ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase === 0
        || attempt < ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase
      );
      attempt++
    ) {

      const { applicantCode, respondentCode } = await this.tryFetchAccessCodesOnce(caseId, attempt);

      if (applicantCode && respondentCode) {
        return { applicantCode, respondentCode };
      }

      const isLastCappedAttempt =
        ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase > 0
        && attempt === ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase - 1;
      if (isLastCappedAttempt) {
        return undefined;
      }

      const exponentialDelay = Math.min(
        ACCESS_CODE_RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
        ACCESS_CODE_RETRY_CONFIG.maxDelayMs
      );
      const jitter = Math.floor(Math.random() * 500);
      const delayMs = Math.min(exponentialDelay + jitter, Math.max(0, deadlineEpochMs - Date.now()));

      if (delayMs <= 0) {
        return undefined;
      }

      // eslint-disable-next-line no-console
      console.info(
        `[Factory Poll] Access codes not ready for case ${caseId} (attempt ${attempt + 1}/${this.getCodeFetchAttemptsLabel()}), waiting ${delayMs}ms...`
      );
      await sleep(delayMs);
    }

    return undefined;
  }

  private static async tryRebuildAccessCodesOnExistingCase(
    caseId: string,
    deadlineEpochMs: number
  ): Promise<{ applicantCode: string; respondentCode: string } | undefined> {
    for (let attempt = 0; attempt < ACCESS_CODE_RETRY_CONFIG.manageHearingsReattemptsPerCase; attempt++) {
      if (Date.now() >= deadlineEpochMs) {
        return undefined;
      }

      try {
        await this.withCaseworkerStartEventRetry(async () => {
          await ContestedEventApi.caseWorkerPerformsAddAHearing(caseId);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console
        console.warn(
          `⚠ Reattempt FR_manageHearings failed for case ${caseId} (attempt ${attempt + 1}/${ACCESS_CODE_RETRY_CONFIG.manageHearingsReattemptsPerCase}): ${message}`
        );
      }

      const codes = await this.waitForAccessCodes(caseId, deadlineEpochMs);
      if (codes) {
        return codes;
      }
    }

    return undefined;
  }

  static async createContestedCaseWithHearingAndAccessCode(): Promise<{
    caseId: string;
    applicantCode: string;
    respondentCode: string;
  }> {
    const startedAtEpochMs = Date.now();
    const deadlineEpochMs = startedAtEpochMs + ACCESS_CODE_RETRY_CONFIG.maxTotalRuntimeMs;
    let lastCaseId = '';
    let lastFailureReason = 'No explicit failure reason captured';
    let attemptsMade = 0;

    for (let attempt = 0; attempt < ACCESS_CODE_RETRY_CONFIG.caseCreationAttempts; attempt++) {
      if (Date.now() >= deadlineEpochMs) {
        lastFailureReason = 'Deadline exceeded before starting next case attempt';
        break;
      }

      attemptsMade++;

      let caseId: string;
      try {
        caseId = await this.createContestedCaseWithHearing();
      } catch (error) {
        if (error instanceof ManageHearingsInfraUnavailableError) {
          lastFailureReason = error.message;
          // eslint-disable-next-line no-console
          console.warn(
            `⚠ Manage hearings unavailable during case creation (attempt ${attempt + 1}/${ACCESS_CODE_RETRY_CONFIG.caseCreationAttempts}): ${error.message}`
          );
          continue;
        }
        throw error;
      }
      lastCaseId = caseId;

      const codes = await this.waitForAccessCodes(caseId, deadlineEpochMs);
      if (codes) {
        return {
          caseId,
          applicantCode: codes.applicantCode,
          respondentCode: codes.respondentCode,
        };
      }
      lastFailureReason = `Access codes absent after initial polling for case ${caseId}`;

      const rebuiltCodes = await this.tryRebuildAccessCodesOnExistingCase(caseId, deadlineEpochMs);
      if (rebuiltCodes) {
        return {
          caseId,
          applicantCode: rebuiltCodes.applicantCode,
          respondentCode: rebuiltCodes.respondentCode,
        };
      }
      lastFailureReason = `Access codes absent after manage-hearings reattempts for case ${caseId}`;

      // eslint-disable-next-line no-console
      console.warn(
        `⚠ Access codes missing for case ${caseId}; creating a fresh case (attempt ${attempt + 1}/${ACCESS_CODE_RETRY_CONFIG.caseCreationAttempts})`
      );
    }

    const elapsedMs = Date.now() - startedAtEpochMs;

    throw new ManageHearingsInfraUnavailableError(
      `Unable to generate Form C access codes. elapsedMs=${elapsedMs}; configuredMaxRuntimeMs=${ACCESS_CODE_RETRY_CONFIG.maxTotalRuntimeMs}; attemptsMade=${attemptsMade}/${ACCESS_CODE_RETRY_CONFIG.caseCreationAttempts}; lastCaseId=${lastCaseId || 'n/a'}; lastFailureReason=${lastFailureReason}`
    );
  }

  static async createContestedCaseWithIssueApplicationAndAccessCode(): Promise<{
    caseId: string;
    applicantCode: string;
    respondentCode: string;
  }> {
    const issueDate = DateHelper.getCurrentDate();
    const caseId = await this.createAndProcessFormACaseUpToIssueApplication(false, issueDate);

    // Start the timeout budget after FR_issueApplication completes.
    const startedAtEpochMs = Date.now();
    const deadlineEpochMs = startedAtEpochMs + ACCESS_CODE_RETRY_CONFIG.maxTotalRuntimeMs;

    const codes = await this.waitForAccessCodes(caseId, deadlineEpochMs);
    if (!codes) {
      const elapsedMs = Date.now() - startedAtEpochMs;
      let debugSnapshotText = 'unavailable';

      try {
        const debugSnapshot = await ContestedEventApi.getAccessCodeDebugSnapshot(caseId);
        debugSnapshotText = JSON.stringify(debugSnapshot);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        debugSnapshotText = `snapshot-read-failed:${message}`;
      }

      throw new AccessCodeGenerationUnavailableError(
        `Access codes not found after FR_issueApplication. elapsedMs=${elapsedMs}; configuredMaxRuntimeMs=${ACCESS_CODE_RETRY_CONFIG.maxTotalRuntimeMs}; caseId=${caseId}; debugSnapshot=${debugSnapshotText}`
      );
    }

    return {
      caseId,
      applicantCode: codes.applicantCode,
      respondentCode: codes.respondentCode,
    };
  }

  /**
   * Get access codes for a case
   * Usage in tests:
   *   const caseId = await ContestedCaseFactory.createContestedCaseWithHearing();
   *   const { applicantCode, respondentCode } = await ContestedCaseFactory.getAccessCodesForCase(caseId);
   *   // Use codes to login via citizen UI: https://finrem-citizen-ui.aat.platform.hmcts.net/case/{caseId}
   */
  static async getAccessCodesForCase(caseId: string): Promise<{ applicantCode: string | undefined; respondentCode: string | undefined }> {
    const applicantCode = await ContestedEventApi.getApplicantAccessCode(caseId);
    const respondentCode = await ContestedEventApi.getRespondentAccessCode(caseId);

    // eslint-disable-next-line no-console
    console.info(
      `Case ${caseId} access codes:\n  Applicant: ${applicantCode || '(not found)'}\n  Respondent: ${respondentCode || '(not found)'}`
    );

    return { applicantCode, respondentCode };
  }

  /**
   * Creates a real contested case but returns deterministic mock access codes.
   * The codes are injected into the app session via the /__test/inject-case-session
   * endpoint rather than being generated through Form C / FR_manageHearings.
   * Use this factory when you need to test the happy-path access-code submission
   * flow without depending on the manage-hearings callback infrastructure.
   */
  static async createContestedCaseWithMockedAccessCode(): Promise<{
    caseId: string;
    applicantCode: string;
    respondentCode: string;
  }> {
    const caseId = String(
      await this.createAndProcessFormACaseUpToProgressToListing(false)
    );
    return {
      caseId,
      applicantCode: 'APPCODE1',
      respondentCode: 'RSPCODE1',
    };
  }

  /**
   * Creates a case for the access-code journey.
   * Default is mock-first (fast, deterministic, no manage-hearings dependency).
   * Set useRealIntegration=true only for dedicated happy-path integration tests.
   */
  static async createCaseForAccessCodeJourney(
    useRealIntegration = false
  ): Promise<{
    caseId: string;
    applicantCode: string;
    respondentCode: string;
  }> {
    if (useRealIntegration) {
      // Real integration path: access codes are generated at FR_issueApplication.
      return this.createContestedCaseWithIssueApplicationAndAccessCode();
    }

    // Default path: mock access codes and inject into test session.
    return this.createContestedCaseWithMockedAccessCode();
  }

  /**
   * Create contested case up to HWF decision
   */
  static async createContestedCaseUpToHWFDecision(): Promise<string> {
    const caseId = await this.createBaseContestedFormA();
    await ContestedEventApi.solicitorSubmitFormACase(caseId);
    await ContestedEventApi.caseWorkerHWFDecisionMade(caseId);
    return caseId;
  }

  /**
   * Create and process Form A case up to issue application
   */
  static async createAndProcessFormACaseUpToIssueApplication(
    isExpressPilot = false,
    issueDate?: string
  ): Promise<string> {
    const caseId = await this.createCase(isExpressPilot, false);

    await this.withSolicitorStartEventRetry(async () => {
      await ContestedEventApi.solicitorSubmitFormACase(caseId);
    });

    // CCD requires HWF decision before FR_issueApplication for this flow.
    await this.withCaseworkerStartEventRetry(async () => {
      await ContestedEventApi.caseWorkerHWFDecisionMade(caseId);
    });

    try {
      await ContestedEventApi.caseWorkerIssueApplication(caseId, true, issueDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isAlreadyIssuedError =
        message.includes('Pre-state condition is not valid')
        && message.includes('applicationIssued')
        && message.includes('FR_issueApplication');

      if (!isAlreadyIssuedError) {
        throw error;
      }

      // FR_issueApplication is already applied for this case; proceed with the issued case.
      // eslint-disable-next-line no-console
      console.warn(`FR_issueApplication already applied for case ${caseId}; proceeding with existing issued state`);
    }

    return caseId;
  }

  /**
   * Create and process Form A case up to flag creation
   */
  static async createAndProcessFormACaseUpToCreateFlag(
    isExpressPilot = false
  ): Promise<string> {
    const caseId = await this.createAndProcessFormACaseUpToIssueApplication(isExpressPilot);
    await ContestedEventApi.caseworkerCreateFlag(caseId);
    return caseId;
  }

  /**
   * Create and submit paper case
   */
  static async createAndSubmitPaperCase(isExpressPilot = false): Promise<string> {
    const caseId = await this.createCase(isExpressPilot, true);
    await ContestedEventApi.caseWorkerIssueApplication(caseId, false);
    return caseId;
  }

  /**
   * Create and process Schedule 1 case up to issue application
   */
  static async createAndProcessSchedule1CaseUpToIssueApplication(
    _isExpressPilot = false
  ): Promise<string> {
    const caseId = await this.createSchedule1Case();
    await ContestedEventApi.solicitorSubmitFormACase(caseId);
    await ContestedEventApi.caseWorkerIssueApplication(caseId);
    return caseId;
  }

  /**
   * Create and allocate case to judge
   */
  static async createAndProcessFormACaseUpToAllocateJudge(
    isExpressPilot = false
  ): Promise<string> {
    const caseId = await this.createCase(isExpressPilot, false);
    await ContestedEventApi.solicitorSubmitFormACase(caseId);
    await ContestedEventApi.caseworkerAllocateToJudge(caseId);
    return caseId;
  }

  /**
   * Progress to general application outcome
   */
  static async caseWorkerProgressToGeneralApplicationOutcome(
    caseId: string
  ): Promise<string> {
    const generalApplicationId = await this.caseworkerProgressToGeneralApplicationReferToJudge(caseId);
    const modifications = OUTCOME_LIST_DATA(generalApplicationId);
    await ContestedEventApi.generalApplicationOutcome(caseId, modifications);
    return caseId;
  }

  /**
   * Create old general application directions hearing
   */
  static async caseWorkerCreateOldGeneralApplicationDirectionsHearing(
    caseId: string
  ): Promise<string> {
    const codeForDirections = await this.caseWorkerProgressToGeneralApplicationOutcome(caseId);
    const modifications = DIRECTIONS_LIST_DATA(codeForDirections);
    await ContestedEventApi.generalApplicationDirections(caseId, modifications);
    return caseId;
  }

  /**
   * Progress to upload draft order
   */
  static async progressToUploadDraftOrder({
    isFormA
  }: {
    isFormA: boolean;
  }): Promise<string> {
    const caseId = isFormA
      ? await this.createBaseContestedFormA()
      : await this.createBaseContestedPaperCase();

    if (isFormA) {
      await ContestedEventApi.solicitorSubmitFormACase(caseId);
    }

    await this.caseworkerListForHearing12To16WeeksFromNow(caseId, isFormA);

    return caseId;
  }

  /**
   * Create and process Form A case up to process order (legacy)
   */
  static async createAndProcessFormACaseUpToProcessOrderLegacy(
    isFormA = true,
    _isExpressPilot = false
  ): Promise<string> {
    const caseId = await this.progressToUploadDraftOrder({ isFormA });
    await ContestedEventApi.agreedDraftOrderApplicant(caseId);
    const hearingDate = await DateHelper.getHearingDateTwelveWeeksLaterInISOFormat();
    const documentDetailsForFutureTestSteps = {
      hearingDate,
      courtOrderDate: hearingDate,
      documentUrl: envTestData.DOCUMENT_URL,
      documentBinaryUrl: envTestData.DOCUMENT_BINARY_URL,
      uploadTimestamp: await DateHelper.getCurrentTimestamp()
    };

    await ContestedEventApi.judgeApproveOrders(caseId, documentDetailsForFutureTestSteps);
    await ContestedEventApi.caseWorkerProcessOrderLegacy(caseId, {
      documentUrl: envTestData.DOCUMENT_URL,
      documentBinaryUrl: envTestData.DOCUMENT_BINARY_URL,
      uploadTimestamp: await DateHelper.getCurrentTimestamp()
    });
    return caseId;
  }

  // Private helper methods

  private static async caseworkerProgressToGeneralApplicationReferToJudge(
    caseId: string
  ): Promise<string> {
    const generalApplicationId = await ContestedEventApi.caseWorkerProgressToCreateGeneralApplication(caseId);
    const modifications = REFER_LIST_DATA(generalApplicationId);
    await ContestedEventApi.generalApplicationReferToJudge(caseId, modifications);
    return generalApplicationId;
  }

  private static async caseworkerListForHearing12To16WeeksFromNow(
    caseId: string,
    isFormACase: boolean = true
  ): Promise<void> {
    const { currentDate } = await DateHelper.getFormattedHearingDate();

    if (isFormACase) {
      await ContestedEventApi.caseWorkerProgressFormACaseToListing(caseId, currentDate);
    } else {
      await ContestedEventApi.caseWorkerProgressPaperCaseToListing(caseId, currentDate);
    }
    await ContestedEventApi.caseWorkerPerformsAddAHearing(caseId);
  }
}
