
export const PublicRoutes = {
  autocomplete: '/autocomplete',
  basePath: '/',
  callbackUrl: '/oauth2/callback',
  health: '/health',
  info: '/info',
  login: '/login',
  logout: '/logout',
} as const;

export const TestRoutes = {
  injectCaseSession: '/__test/inject-case-session',
} as const;

export const PrivateRoutes = {
  caseUserRole: '/case/:caseReference/:userId/:caseRole',
  caseReference: '/case/:caseReference',
  retrieveCase: '/retrieveCase',
  enterCaseNumber: '/enter-case-number',
  dashboard: '/dashboard',
  enterAccessCode: '/enter-access-code',
  taskListUpload: '/task-list-upload-dashboard',
  uploadJourney: '/upload',
  getCaseRole: '/getCaseRole',
  documents: '/documents',
  documentUpload: '/documents/upload',
  documentSend: '/documents/send',
  documentDownload: '/documents/:documentId/download',
  documentRemove: '/documents/remove/:fileId',
} as const;

export const RouteNames = {
  ...PublicRoutes,
  ...PrivateRoutes,
} as const;

export const ViewNames = {
  Dashboard: 'dashboard',
  EnterCaseNumber: 'enter-case-number',
  EnterAccessCode: 'enter-access-code',
  Document: 'document',
  Error: 'error',
  NotFound: 'not-found',
  TaskListUploadDashboard: 'task-list-upload-dashboard',
  UploadJourneyBeforeYouStart: 'upload-journey/before-you-start',
  UploadJourneyConfidentiality: 'upload-journey/confidentiality',
};

export const UploadStepNames = {
  BeforeYouStart: 'before-you-start',
  PUD: 'previously-uploaded-documents',
  Confidentiality: 'confidentiality',
  FDR: 'fdr',
  DocumentTypeSelection: 'document-type-selection',
  UploadDocuments: 'upload-documents',
  CheckUpload: 'check-upload',
  SendToOtherParty: 'send-to-other-party',
  Confirmation: 'confirmation',
};

export const CaseUserNames = {
  APPLICANT: 'Applicant',
  RESPONDENT: 'Respondent',
} as const;


export const UrlEndPoints = {
  CaseEvents: (caseId: string): string => `/cases/${caseId}/events`,
  CaseEventTrigger: (caseId: string, eventId: string) => `/cases/${caseId}/event-triggers/${eventId}`,
  CaseUsers: '/case-users',
  CaseId: (caseId: string) => `/cases/${caseId}`,
  SearchCasesBase: '/searchCases',
  SearchCases: (caseType: string) => `/searchCases?ctid=${caseType}`,
  UploadDocument: '/cases/documents',
  GetDocument: (documentId: string) => `/cases/documents/${documentId}/binary`,
  CaseRoles: '/case-users/search',
  PreviouslyUploadedDocuments: (caseId: string, userRole: string) => `/cases/${caseId}/event-triggers/${userRole}`,
} as const;

/**
 * Maps document types that should be auto-renamed to their rename format.
 * Format: UserName-{RenameFormat}-DD-MM-YY
 * 
 * If a document type is in this object, it will be auto-renamed.
 * If not, it keeps its original filename.
 */
export const DOCUMENT_RENAME_FORMATS: Record<string, string> = {
  'family-mediation-information-and-assessment-meeting-miam-form-form-fm1': 'FormFM1',
  'statement-of-position-on-non-court-dispute-resolution-ncdr-form-fm5': 'FormFM5',
  'estimate-of-costs-incurred-form-h': 'FormH',
  'statement-of-costs-form-h1': 'FormH1',
  'statement-of-costs-summary-assessment-form-n260': 'N260',
  'certificate-of-service-form-fp6': 'FP6',
  'response-to-the-notice-of-first-appointment-form-g': 'FormG',
  'position-statement': 'PositionStatement',
  'chronology': 'Chronology',
  'statement-of-issues': 'StatementOfIssues',
  'composite-case-summary-form-es1': 'ES1',
  'composite-schedule-of-assets-and-income-form-es2': 'ES2',
  'market-appraisal-or-valuation-of-family-home': 'FamilyHomeValuation',
  'housing-needs-property-particulars': 'Property-Particulars',
  'open-offers': 'OpenOffers',
  'questionnaire-request-for-further-documents': 'Questionnaire',
  'section-25-statement': 's25statement',
  'witness-statement': 'WitnessStatements',
  'without-prejudice-offers-for-settlement': 'WithoutPrejudiceOffers',
  'pension-report-expert-report': 'ExpertReports',
  'hearing-bundle': 'bundle',
  'fdr-bundle': 'bundle',
};
