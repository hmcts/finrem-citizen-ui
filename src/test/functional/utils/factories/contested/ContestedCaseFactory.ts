import { CaseType, ContestedEvents, PayloadPath } from '../../../config/case-data';
import { ReplacementAction } from '../../../types/replacement-action';
import { ContestedEventApi } from '../../api/contested/ContestedEventApi';
import { CaseDataBuilder } from '../../CaseDataBuilder';
import {
  ESTIMATED_ASSETS_UNDER_1M,
  EXPRESS_PILOT_PARTICIPATING_COURT_REPLACEMENT,
} from '../../PayloadMutator';

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
      message.includes('status 404') &&
      (message.includes('No case found') ||
        message.includes('CaseNotFoundException') ||
        message.includes('Cannot find case for given criteria'))
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

  private static async pollUntilReady<T>(operation: () => Promise<T>, retryLabel: string): Promise<T> {
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
        console.log(
          `[Factory Poll] ${retryLabel} transient error "${errorType}" (attempt ${attempt + 1}/${START_EVENT_RETRY_CONFIG.maxRetries + 1}), waiting ${delayMs}ms...`
        );
        await sleep(delayMs);
      }
    }

    throw lastError;
  }

  private static async withCaseworkerStartEventRetry<T>(operation: () => Promise<T>): Promise<T> {
    return this.pollUntilReady(operation, 'Caseworker start-event');
  }

  private static async buildContestedCase({
    replacements = [],
    event,
    payloadPath,
  }: {
    isPaper: boolean;
    replacements?: ReplacementAction[];
    event?: string;
    payloadPath?: string;
  }): Promise<string> {
    const derivedEvent =
      event || ContestedEvents.createPaperCase.ccdCallback;

    const derivedPayloadPath = payloadPath || PayloadPath.Contested.paper;

    const builder = new CaseDataBuilder(CaseType.Contested, derivedEvent)
     ['withCaseWorkerUser']()
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
      replacements: [],
    });
  }

  static createBaseContestedPaperCase(): Promise<string> {
    return this.buildContestedCase({ isPaper: true });
  }

  static createContestedPaperCaseWithExpressPilotEnrolled(): Promise<string> {
    return this.buildContestedCase({
      isPaper: true,
      replacements: EXPRESS_PILOT_PARTICIPATING_COURT_REPLACEMENT,
    });
  }

  static createContestedPaperCaseWithEstimatedAssetUnder1M(): Promise<string> {
    return this.buildContestedCase({
      isPaper: true,
      replacements: [...EXPRESS_PILOT_PARTICIPATING_COURT_REPLACEMENT, ...ESTIMATED_ASSETS_UNDER_1M],
    });
  }

  // Reusable helper for creating cases
  private static async createCase(isExpressPilot: boolean, isPaper: boolean): Promise<string> {
    return isPaper ? this.createBaseContestedPaperCase() : this.createBaseContestedFormA();
  }
  
  /**
   * Create paper case and issue application
   */
  static async createAndIssuePaperCase(
    isExpressPilot = false,
    issueDate?: string
  ): Promise<{
    caseId: string;
    applicantCode: string;
    respondentCode: string;
  }> {
    const caseId = await this.pollUntilReady(() => this.createCase(isExpressPilot, true), 'Paper case creation');

    // Replace fixed waits with targeted retry for eventual consistency on caseworker start-events.
    await this.withCaseworkerStartEventRetry(async () => {
      await ContestedEventApi.caseWorkerManualPayment(caseId);
      await ContestedEventApi.caseWorkerIssueApplication(caseId, false, issueDate);
    });

    const accessCodes = await this.waitForAccessCodes(caseId, Date.now() + 60_000);

    return {
      caseId,
      applicantCode: accessCodes?.applicantCode ?? '',
      respondentCode: accessCodes?.respondentCode ?? '',
    };
  }

  private static async waitForAccessCodes(
    caseId: string,
    deadlineEpochMs: number
  ): Promise<{ applicantCode: string; respondentCode: string } | undefined> {
    for (
      let attempt = 0;
      Date.now() < deadlineEpochMs &&
      (ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase === 0 ||
        attempt < ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase);
      attempt++
    ) {
      const { applicantCode, respondentCode } = await this.tryFetchAccessCodesOnce(caseId, attempt);

      if (applicantCode && respondentCode) {
        return { applicantCode, respondentCode };
      }

      const isLastCappedAttempt =
        ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase > 0 &&
        attempt === ACCESS_CODE_RETRY_CONFIG.codeFetchAttemptsPerCase - 1;
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

  /**
   * Get access codes for a case
   * Usage in tests:
   *   const caseId = await ContestedCaseFactory.createContestedCaseWithHearing();
   *   const { applicantCode, respondentCode } = await ContestedCaseFactory.getAccessCodesForCase(caseId);
   *   // Use codes to login via citizen UI: https://finrem-citizen-ui.aat.platform.hmcts.net/case/{caseId}
   */
  static async getAccessCodesForCase(
    caseId: string
  ): Promise<{ applicantCode: string | undefined; respondentCode: string | undefined }> {
    const applicantCode = await ContestedEventApi.getApplicantAccessCode(caseId);
    const respondentCode = await ContestedEventApi.getRespondentAccessCode(caseId);

    // eslint-disable-next-line no-console
    console.info(
      `Case ${caseId} access codes:\n  Applicant: ${applicantCode || '(not found)'}\n  Respondent: ${respondentCode || '(not found)'}`
    );

    return { applicantCode, respondentCode };
  }
}
