import { CaseType, ContestedEvents, PayloadPath } from '../../../config/case-data';
import config from '../../../config/config';
import { ReplacementAction } from '../../../types/replacement-action';
import { ccdApi } from '../../helpers/CcdApi';

/**
 * API helper for progressing contested cases through various CCD events
 */
export class ContestedEventApi {
  private static readonly caseType = CaseType.Contested;
  private static readonly loggedReadFallbackCases = new Set<string>();

  private static readonly applicantAccessCodeFieldCandidates = [
    'applicantAccessCodes',
  ] as const;

  private static readonly respondentAccessCodeFieldCandidates = [
    'respondentAccessCodes',
  ] as const;

  private static asNonEmptyString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private static readAccessCodeFromValue(value: unknown): string | undefined {
    const direct = this.asNonEmptyString(value);
    if (direct) {
      return direct;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedCode = this.readAccessCodeFromValue(item);
        if (nestedCode) {
          return nestedCode;
        }
      }
      return undefined;
    }

    if (value && typeof value === 'object') {
      return this.readAccessCodeFromRecord(value as Record<string, unknown>);
    }

    return undefined;
  }

  private static readAccessCodeFromRecord(record: Record<string, unknown>): string | undefined {
    const known =
      this.asNonEmptyString(record.accessCode)
      || this.readAccessCodeFromValue(record.value);

    if (known) {
      return known;
    }

    for (const nestedValue of Object.values(record)) {
      const nestedCode = this.readAccessCodeFromValue(nestedValue);
      if (nestedCode) {
        return nestedCode;
      }
    }

    return undefined;
  }

  private static readAccessCodeFromCandidates(
    payload: Record<string, unknown>,
    candidateFields: readonly string[]
  ): string | undefined {
    for (const field of candidateFields) {
      const code = this.readAccessCodeFromValue(payload[field]);
      if (code) {
        return code;
      }
    }

    return undefined;
  }

  private static shouldLogVerboseFallbacks(): boolean {
    return process.env.CCD_VERBOSE_RETRY === 'true' || !!process.env.CI;
  }

  private static isCaseNotFound404(error: unknown): boolean {
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

  private static isCaseworkerFallbackEligibleError(error: unknown): boolean {
    if (this.isCaseNotFound404(error)) {
      return true;
    }

    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('status 401')
      && (
        message.includes('Problem getting case type version')
        || message.includes('Unexpected Error')
      )
    );
  }

  /**
   * Get caseworker credentials from config
   */
  private static get caseworker() {
    return {
      username: config.caseworker.username,
      password: config.caseworker.password,
    };
  }

  /**
   * System user fallback for CCD visibility/role propagation issues.
   *
   * In AAT and CI, newly created/updated cases can be temporarily inaccessible to
   * one user while visible to another. Fallback avoids flaky failures while still
   * surfacing persistent authorization problems.
   */
  private static get systemUser() {
    return {
      username: config.systemUser.username,
      password: config.systemUser.password,
    };
  }

  private static async updateCaseworkerEvent(
    caseId: string,
    eventId: string,
    payloadPath: string,
    modifications: ReplacementAction[] = []
  ): Promise<void> {
    const hasSystemUser =
      !!this.systemUser.username
      && !!this.systemUser.password
      && this.systemUser.username !== this.caseworker.username;

    const preferSystemUser = !!config.useSystemUserForCaseworkerEvents && hasSystemUser;

    const primaryCredentials = preferSystemUser ? this.systemUser : this.caseworker;
    const fallbackCredentials = preferSystemUser ? this.caseworker : this.systemUser;

    try {
      await ccdApi.updateCaseInCcd(
        primaryCredentials.username,
        primaryCredentials.password,
        caseId,
        this.caseType,
        eventId,
        payloadPath,
        modifications
      );
      return;
    } catch (error) {
      const canFallback = !!fallbackCredentials.username && !!fallbackCredentials.password;

      if (!canFallback || !this.isCaseworkerFallbackEligibleError(error)) {
        throw error;
      }

      // Expected in some lanes: primary actor updates case, fallback actor can still
      // be needed briefly until cross-user case visibility settles.
      if (this.shouldLogVerboseFallbacks()) {
        // eslint-disable-next-line no-console
        console.warn(
          `[CCD Fallback] Primary user cannot access case ${caseId} for event ${eventId}. Retrying with fallback user.`
        );
      }

      await ccdApi.updateCaseInCcd(
        fallbackCredentials.username,
        fallbackCredentials.password,
        caseId,
        this.caseType,
        eventId,
        payloadPath,
        modifications
      );
    }
  }

  static async caseWorkerManualPayment(caseId: string): Promise<void>  {
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.manualPayment.ccdCallback,
      PayloadPath.Contested.manualPayment,
    );
  }

  /**
   * Caseworker issues application
   */
  static async caseWorkerIssueApplication(
    caseId: string,
    _isFormA: boolean = true,
    issueDate?: string
  ): Promise<void> {
    const modifications: ReplacementAction[] = issueDate
      ? [{ action: 'insert', key: 'issueDate', value: issueDate }]
      : [];

    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.issueApplication.ccdCallback,
      '',
      modifications
    );
  }

  /**
   * Fetch complete case data from CCD
   * Used to retrieve case details including access codes
   */
  static async getCaseData(caseId: string): Promise<Record<string, unknown>> {
    const hasSystemUser =
      !!this.systemUser.username
      && !!this.systemUser.password
      && this.systemUser.username !== this.caseworker.username;

    const preferSystemUser = !!config.useSystemUserForCaseworkerEvents && hasSystemUser;
    const primaryCredentials = preferSystemUser ? this.systemUser : this.caseworker;
    const fallbackCredentials = preferSystemUser ? this.caseworker : this.systemUser;

    try {
      return await ccdApi.getCaseData(
        primaryCredentials.username,
        primaryCredentials.password,
        caseId,
        this.caseType
      );
    } catch (error) {
      const canFallback = !!fallbackCredentials.username && !!fallbackCredentials.password;

      if (!canFallback || !this.isCaseNotFound404(error)) {
        throw error;
      }

      const alreadyLogged = this.loggedReadFallbackCases.has(caseId);
      if (!alreadyLogged && this.shouldLogVerboseFallbacks()) {
        this.loggedReadFallbackCases.add(caseId);
        // Expected in eventual-consistency windows: read visibility can lag behind
        // successful writes/events for a short period.
        // eslint-disable-next-line no-console
        console.info(
          `[CCD Fallback] Primary user cannot read case ${caseId}. Retrying case-data read with fallback user.`
        );
      }

      return ccdApi.getCaseData(
        fallbackCredentials.username,
        fallbackCredentials.password,
        caseId,
        this.caseType
      );
    }
  }

  /**
   * Reads access-code values from the case record by taking index 0 from
   * applicant/respondent access-code collections.
  
   * - This is intended for test automation/manual test setup only.
   * - It is not a reliable source of truth for application flows.
   * - It returns a code associated with the just-created test case data and
   *   does not guarantee a "latest" access code if multiple codes exist.
   */
  static async getCaseAccessCodesById(caseId: string): Promise<{
    applicantAccessCode?: string;
    respondentAccessCode?: string;
  }> {
    const caseData = await this.getCaseData(caseId);
    const casePayload = (caseData.case_data as Record<string, unknown> | undefined) || caseData;

    return {
      applicantAccessCode: this.readAccessCodeFromCandidates(
        casePayload,
        this.applicantAccessCodeFieldCandidates
      ),
      respondentAccessCode: this.readAccessCodeFromCandidates(
        casePayload,
        this.respondentAccessCodeFieldCandidates
      ),
    };
  }

  /**
   * Get applicant access code from case
   * Returns the access code string or undefined if not found
   */
  static async getApplicantAccessCode(caseId: string): Promise<string | undefined> {
    const accessCodes = await this.getCaseAccessCodesById(caseId);
    return accessCodes.applicantAccessCode;
  }

  /**
   * Get respondent access code from case
   * Returns the access code string or undefined if not found
   */
  static async getRespondentAccessCode(caseId: string): Promise<string | undefined> {
    const accessCodes = await this.getCaseAccessCodesById(caseId);
    return accessCodes.respondentAccessCode;
  }
}
