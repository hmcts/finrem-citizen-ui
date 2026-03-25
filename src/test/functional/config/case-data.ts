/**
 * Case types and event definitions for CCD
 */

export const CaseType = {
  Contested: 'FinancialRemedyContested',
  Consented: 'FinancialRemedyMVP2',
} as const;

export type CaseTypeValue = typeof CaseType[keyof typeof CaseType];

export const ContestedEvents = {
  createCase: {
    ccdCallback: 'FR_solicitorCreate',
    description: 'Solicitor creates Form A application',
  },
  createPaperCase: {
    ccdCallback: 'FR_newPaperCase',
    description: 'Caseworker creates paper case',
  },
  solicitorSubmit: {
    ccdCallback: 'FR_applicationPaymentSubmission',
    description: 'Solicitor submits application',
  },
  hwfDecision: {
    ccdCallback: 'FR_HWFDecisionMade',
    description: 'HWF decision made',
  },
  issueApplication: {
    ccdCallback: 'FR_issueApplication',
    description: 'Issue application',
  },
  allocateToJudge: {
    ccdCallback: 'FR_allocateToJudge',
    description: 'Allocate to judge',
  },
  progressToListing: {
    ccdCallback: 'FR_progressToSchedulingAndListing',
    description: 'Progress to scheduling and listing',
  },
  manageHearings: {
    ccdCallback: 'FR_manageHearings',
    description: 'Manage hearings including add hearing',
  },
  addHearing: {
    ccdCallback: 'FR_addSchedulingListingInfo',
    description: 'Add hearing schedule (legacy)',
  },
  uploadDraftOrder: {
    ccdCallback: 'FR_draftOrdersUpload',
    description: 'Upload draft order',
  },
  approveOrders: {
    ccdCallback: 'FR_approveApplication',
    description: 'Judge approve orders',
  },
  processOrder: {
    ccdCallback: 'FR_sendOrder',
    description: 'Process order',
  },
  createGeneralApplication: {
    ccdCallback: 'FR_createGeneralApplication',
    description: 'Create general application',
  },
  referToJudge: {
    ccdCallback: 'FR_generalApplicationReferToJudge',
    description: 'Refer general application to judge',
  },
  gaOutcome: {
    ccdCallback: 'FR_generalApplicationOutcome',
    description: 'General application outcome',
  },
  gaDirections: {
    ccdCallback: 'FR_generalApplicationDirections',
    description: 'General application directions',
  },
  createFlag: {
    ccdCallback: 'createFlag',
    description: 'Create case flag',
  },
  agreedDraftOrder: {
    ccdCallback: 'FR_agreedDraftOrdersUpload',
    description: 'Upload agreed draft order',
  },
} as const;

export const ConsentedEvents = {
  createCase: {
    ccdCallback: 'FR_solicitorCreate',
    description: 'Solicitor creates consented case',
  },
  solicitorSubmit: {
    ccdCallback: 'FR_applicationPaymentSubmission',
    description: 'Submit consented application',
  },
} as const;

/**
 * Payload paths for test data JSON files
 */
export const PayloadPath = {
  Contested: {
    formA: 'src/test/functional/utils/test_data/payloads/contested/solicitorFormA.json',
    formASubmit: 'src/test/functional/utils/test_data/payloads/contested/caseSubmission.json',
    paper: 'src/test/functional/utils/test_data/payloads/contested/paperCase.json',
    schedule1: 'src/test/functional/utils/test_data/payloads/contested/schedule1.json',
    hearing: 'src/test/functional/utils/test_data/payloads/contested/addHearing.json',
    draftOrder: 'src/test/functional/utils/test_data/payloads/contested/draftOrder.json',
  },
  Consented: {
    base: 'src/test/functional/utils/test_data/payloads/consented/base.json',
  },
} as const;

/**
 * Case states in CCD
 */
export const CaseState = {
  // Contested
  applicationSubmitted: 'applicationSubmitted',
  applicationIssued: 'applicationIssued',
  gateKeepingAndAllocation: 'gateKeepingAndAllocation',
  schedulingAndHearing: 'schedulingAndHearing',
  prepareForHearing: 'prepareForHearing',
  readyForHearing: 'readyForHearing',
  responseReceived: 'responseReceived',
  // Consented
  consentOrderMade: 'consentOrderMade',
  awaitingPaymentResponse: 'awaitingPaymentResponse',
} as const;
