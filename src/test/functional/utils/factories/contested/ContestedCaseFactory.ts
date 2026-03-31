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

// Helper to wait for CCD eventual consistency
const waitForCcdConsistency = (ms = 3000) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Factory for creating contested cases in various states
 */
export class ContestedCaseFactory {
  private static buildContestedCase({
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

    if (replacements.length) {builder.addReplacements(...replacements);}
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
    // Wait for CCD eventual consistency before subsequent events
    await waitForCcdConsistency();
    await ContestedEventApi.solicitorSubmitFormACase(caseId);
    // Wait for CCD to propagate case data before caseworker operations
    // Caseworker may use different CCD nodes, requiring eventual consistency
    await waitForCcdConsistency(5000);
    await ContestedEventApi.caseWorkerProgressFormACaseToListing(caseId, issueDate);
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
    // Wait for CCD eventual consistency before subsequent caseworker events
    await waitForCcdConsistency(5000);
    await ContestedEventApi.caseWorkerProgressPaperCaseToListing(caseId, issueDate);
    return caseId;
  }

  /**
   * Create contested case with hearing date scheduled
   * This is the main method for creating a case ready for citizen to link
   */
  static async createContestedCaseWithHearing(): Promise<string> {
    // Must provide issue date for issueApplication event
    const issueDate = DateHelper.getCurrentDate();
    const caseId = await this.createAndProcessFormACaseUpToProgressToListing(false, issueDate);

    // Manage hearings (FR_manageHearings) generates Form C and access codes
    await waitForCcdConsistency();
    try {
      await ContestedEventApi.caseWorkerPerformsAddAHearing(caseId);
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
    }

    return caseId;
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
    await ContestedEventApi.solicitorSubmitFormACase(caseId);
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
