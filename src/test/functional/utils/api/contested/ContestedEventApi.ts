import { CaseType, ContestedEvents, PayloadPath } from '../../../config/case-data';
import config from '../../../config/config';
import { ReplacementAction } from '../../../types/replacement-action';
import { DateHelper } from '../../DateHelper';
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

  private static readAccessCodeCollectionCount(
    payload: Record<string, unknown>,
    candidateFields: readonly string[]
  ): number {
    for (const field of candidateFields) {
      const value = payload[field];
      if (Array.isArray(value)) {
        return value.length;
      }
    }

    return 0;
  }

  private static getAccessCodeRelatedKeys(payload: Record<string, unknown>): string[] {
    return Object.keys(payload).filter(key => /access.?code/i.test(key));
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
   * Get solicitor credentials from config
   */
  private static get solicitor() {
    return {
      username: config.solicitor.username,
      password: config.solicitor.password,
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

      if (!canFallback || !this.isCaseNotFound404(error)) {
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

  /**
   * Solicitor submits Form A application
   */
  static async solicitorSubmitFormACase(caseId: string): Promise<void> {
    await ccdApi.updateCaseInCcd(
      this.solicitor.username,
      this.solicitor.password,
      caseId,
      this.caseType,
      ContestedEvents.solicitorSubmit.ccdCallback,
      PayloadPath.Contested.formASubmit // Use case submission payload
    );
  }

  /**
   * Caseworker makes HWF decision
   */
  static async caseWorkerHWFDecisionMade(caseId: string): Promise<void> {
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.hwfDecision.ccdCallback,
      ''
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
   * Caseworker allocates to judge
   */
  static async caseworkerAllocateToJudge(caseId: string): Promise<void> {
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.allocateToJudge.ccdCallback,
      ''
    );
  }

  /**
   * Progress Form A case to listing
   * Flow: HWF Decision -> Issue Application -> Progress to Listing
   */
  static async caseWorkerProgressFormACaseToListing(
    caseId: string,
    issueDate?: string
  ): Promise<void> {
    // 1. Make HWF decision first
    await this.caseWorkerHWFDecisionMade(caseId);
    // 2. Issue application
    await this.caseWorkerIssueApplication(caseId, true, issueDate);
    // 3. Progress to listing
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.progressToListing.ccdCallback,
      ''
    );
  }

  /**
   * Progress paper case to listing
   * Flow: Manual Payment -> Issue Application -> Progress to Listing
   */
  static async caseWorkerProgressPaperCaseToListing(
    caseId: string,
    issueDate?: string
  ): Promise<void> {
    await this.caseWorkerIssueApplication(caseId, false, issueDate);
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.progressToListing.ccdCallback,
      ''
    );
  }

  /**
   * Add hearing to case using manageHearings event
   */
  static async caseWorkerPerformsAddAHearing(caseId: string): Promise<void> {
    const hearingDate = await DateHelper.getHearingDateTwelveWeeksLaterInISOFormat();
    const modifications: ReplacementAction[] = [
      { action: 'replace', key: '__HEARING_DATE__', value: hearingDate }
    ];

    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.manageHearings.ccdCallback,
      PayloadPath.Contested.hearing,
      modifications
    );
  }

  /**
   * Create general application
   */
  static async caseWorkerProgressToCreateGeneralApplication(
    caseId: string
  ): Promise<string> {
    const hasSystemUser =
      !!this.systemUser.username
      && !!this.systemUser.password
      && this.systemUser.username !== this.caseworker.username;

    const preferSystemUser = !!config.useSystemUserForCaseworkerEvents && hasSystemUser;
    const primaryCredentials = preferSystemUser ? this.systemUser : this.caseworker;
    const fallbackCredentials = preferSystemUser ? this.caseworker : this.systemUser;

    let response;
    try {
      response = await ccdApi.updateCaseInCcd(
        primaryCredentials.username,
        primaryCredentials.password,
        caseId,
        this.caseType,
        ContestedEvents.createGeneralApplication.ccdCallback,
        ''
      );
    } catch (error) {
      const canFallback = !!fallbackCredentials.username && !!fallbackCredentials.password;

      if (!canFallback || !this.isCaseNotFound404(error)) {
        throw error;
      }

      if (this.shouldLogVerboseFallbacks()) {
        // eslint-disable-next-line no-console
        console.warn(
          `[CCD Fallback] Primary user cannot access case ${caseId} for event ${ContestedEvents.createGeneralApplication.ccdCallback}. Retrying with fallback user.`
        );
      }

      response = await ccdApi.updateCaseInCcd(
        fallbackCredentials.username,
        fallbackCredentials.password,
        caseId,
        this.caseType,
        ContestedEvents.createGeneralApplication.ccdCallback,
        ''
      );
    }
    // Return the general application ID from the response
    const generalApplications = response?.generalApplications as { id: string }[] | undefined;
    return generalApplications?.[0]?.id || '';
  }

  /**
   * Refer general application to judge
   */
  static async generalApplicationReferToJudge(
    caseId: string,
    modifications: ReplacementAction[]
  ): Promise<void> {
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.referToJudge.ccdCallback,
      '',
      modifications
    );
  }

  /**
   * General application outcome
   */
  static async generalApplicationOutcome(
    caseId: string,
    modifications: ReplacementAction[]
  ): Promise<void> {
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.gaOutcome.ccdCallback,
      '',
      modifications
    );
  }

  /**
   * General application directions
   */
  static async generalApplicationDirections(
    caseId: string,
    modifications: ReplacementAction[]
  ): Promise<void> {
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.gaDirections.ccdCallback,
      '',
      modifications
    );
  }

  /**
   * Create case flag
   */
  static async caseworkerCreateFlag(caseId: string): Promise<void> {
    await this.updateCaseworkerEvent(
      caseId,
      ContestedEvents.createFlag.ccdCallback,
      ''
    );
  }

  /**
   * Upload agreed draft order (applicant)
   */
  static async agreedDraftOrderApplicant(caseId: string): Promise<void> {
    await ccdApi.updateCaseInCcd(
      this.solicitor.username,
      this.solicitor.password,
      caseId,
      this.caseType,
      ContestedEvents.agreedDraftOrder.ccdCallback,
      ''
    );
  }

  /**
   * Judge approves orders
   */
  static async judgeApproveOrders(
    caseId: string,
    documentDetails: Record<string, string>
  ): Promise<void> {
    const modifications: ReplacementAction[] = Object.entries(documentDetails).map(
      ([key, value]) => ({ action: 'insert' as const, key, value })
    );

    await ccdApi.updateCaseInCcd(
      this.caseworker.username,
      this.caseworker.password,
      caseId,
      this.caseType,
      ContestedEvents.approveOrders.ccdCallback,
      '',
      modifications
    );
  }

  /**
   * Process order (legacy)
   */
  static async caseWorkerProcessOrderLegacy(
    caseId: string,
    documentDetails: Record<string, string>
  ): Promise<void> {
    const modifications: ReplacementAction[] = Object.entries(documentDetails).map(
      ([key, value]) => ({ action: 'insert' as const, key, value })
    );

    await ccdApi.updateCaseInCcd(
      this.caseworker.username,
      this.caseworker.password,
      caseId,
      this.caseType,
      ContestedEvents.processOrder.ccdCallback,
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
   * Returns non-sensitive diagnostics to confirm whether access-code generation
   * fields exist and are populated on the case record.
   */
  static async getAccessCodeDebugSnapshot(caseId: string): Promise<{
    applicantCodesCount: number;
    respondentCodesCount: number;
    hasApplicantAccessCodeValue: boolean;
    hasRespondentAccessCodeValue: boolean;
    caseDataTopLevelKeys: string[];
    casePayloadKeys: string[];
    accessCodeRelatedPayloadKeys: string[];
  }> {
    const caseData = await this.getCaseData(caseId);
    const casePayload = (caseData.case_data as Record<string, unknown> | undefined) || caseData;
    const applicantCode = this.readAccessCodeFromCandidates(casePayload, this.applicantAccessCodeFieldCandidates);
    const respondentCode = this.readAccessCodeFromCandidates(casePayload, this.respondentAccessCodeFieldCandidates);

    return {
      applicantCodesCount: this.readAccessCodeCollectionCount(casePayload, this.applicantAccessCodeFieldCandidates),
      respondentCodesCount: this.readAccessCodeCollectionCount(casePayload, this.respondentAccessCodeFieldCandidates),
      hasApplicantAccessCodeValue: !!applicantCode,
      hasRespondentAccessCodeValue: !!respondentCode,
      caseDataTopLevelKeys: Object.keys(caseData),
      casePayloadKeys: Object.keys(casePayload),
      accessCodeRelatedPayloadKeys: this.getAccessCodeRelatedKeys(casePayload),
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
