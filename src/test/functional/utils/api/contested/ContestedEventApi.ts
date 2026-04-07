import { CaseType, ContestedEvents, PayloadPath } from '../../../config/case-data';
import config from '../../../config/config';
import { ReplacementAction } from '../../../types/replacement-action';
import { DateHelper } from '../../DateHelper';
import { ccdApi } from '../../helpers/CcdApi';

/**
 * API helper for progressing contested cases through various CCD events
 */
export class ContestedEventApi {
  private static caseType = CaseType.Contested;

  private static isCaseNotFound404(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('status 404') && message.includes('No case found');
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
   * System user fallback for CCD visibility issues in CI.
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

      // eslint-disable-next-line no-console
      console.warn(
        `[CCD Fallback] Primary user cannot access case ${caseId} for event ${eventId}. Retrying with fallback user.`
      );

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

      // eslint-disable-next-line no-console
      console.warn(
        `[CCD Fallback] Primary user cannot access case ${caseId} for event ${ContestedEvents.createGeneralApplication.ccdCallback}. Retrying with fallback user.`
      );

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
}
