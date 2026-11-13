/**
 * Case types and event definitions for CCD
 */

export const CaseType = {
  Contested: 'FinancialRemedyContested',
  Consented: 'FinancialRemedyMVP2',
} as const;

export type CaseTypeValue = typeof CaseType[keyof typeof CaseType];

export const ContestedEvents = {
  createPaperCase: {
    ccdCallback: 'FR_newPaperCase',
    description: 'Caseworker creates paper case',
  },
  issueApplication: {
    ccdCallback: 'FR_issueApplication',
    description: 'Issue application',
  },
  manualPayment: {
    listItem: "Manual Payment",
    ccdCallback: "FR_manualPayment"
  }
} as const;

/**
 * Payload paths for test data JSON files
 */
export const PayloadPath = {
  Contested: {
    paper: 'src/test/functional/utils/test_data/payloads/contested/paperCase.json',
    manualPayment: 'src/test/functional/utils/test_data/payloads/contested/manualPayment.json',
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
