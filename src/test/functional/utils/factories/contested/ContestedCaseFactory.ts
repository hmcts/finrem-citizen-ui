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

const START_EVENT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
};

const ACCESS_CODE_RETRY_CONFIG = {
  caseCreationAttempts: 1,
  codeFetchAttemptsPerCase: 1,
  manageHearingsReattemptsPerCase: 0,
  initialDelayMs: 500,
  maxDelayMs: 2000,
  maxTotalRuntimeMs: 15000,
};

export class ManageHearingsInfraUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManageHearingsInfraUnavailableError';
  }
}

/**
 * Factory for creating contested cases in various states
 */
export class ContestedCaseFactory {
  private static isCaseNotFound404(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('status 404') && message.includes('No case found');
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

        if (!this.isCaseNotFound404(error) || attempt === START_EVENT_RETRY_CONFIG.maxRetries) {
          throw error;
        }

        const delayMs = Math.min(
          START_EVENT_RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
          START_EVENT_RETRY_CONFIG.maxDelayMs
        );

        // eslint-disable-next-line no-console
        console.log(`[Factory Poll] ${retryLabel} not ready (attempt ${attempt + 1}/${START_EVENT_RETRY_CONFIG.maxRetries + 1}), waiting ${delayMs}ms...`);
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
      await builder.addReplacements(...replacements);
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
    const caseId = await this.createCase(isExpressPilot, false);

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
    const caseId = await this.createCase(isExpressPilot, true);

    // Replace fixed waits with targeted retry for eventual consistency on caseworker start-events.
    await this.withCaseworkerStartEventRetry(async () => {
      await ContestedEventApi.caseWorkerProgressPaperCaseToListing(caseId, issueDate);
    });

    return caseId;
  }

  /**
   * Create contested case with hearing date scheduled
   * This is the main method for creating a case ready for citizen to link
   */
  static async createContestedCaseWithHearing(): Promise<string> {
    // Must provide issue date for issueApplication event
    const issueDate = DateHelper.getCurrentDate();
    const caseId = await this.createAndProcessFormACaseUpToIssueApplication(false, issueDate);

    // Manage hearings (FR_manageHearings) generates Form C and access codes
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
    for (let attempt = 0; attempt < ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase; attempt++) {
      if (Date.now() >= deadlineEpochMs) {
        return undefined;
      }

      const applicantCode = await ContestedEventApi.getApplicantAccessCode(caseId);
      const respondentCode = await ContestedEventApi.getRespondentAccessCode(caseId);

      if (applicantCode && respondentCode) {
        return { applicantCode, respondentCode };
      }

      // No point waiting after the last (or only) polling attempt.
      if (attempt === ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase - 1) {
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
        `[Factory Poll] Access codes not ready for case ${caseId} (attempt ${attempt + 1}/${ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase}), waiting ${delayMs}ms...`
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

    await ContestedEventApi.caseWorkerIssueApplication(caseId, true, issueDate);
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
