
export const PublicRoutes = {
  autocomplete: '/autocomplete',
  basePath: '/',
  callbackUrl: '/oauth2/callback',
  demoAutocomplete: '/demo/autocomplete',
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
} as const;

export const RouteNames = {
  ...PublicRoutes,
  ...PrivateRoutes,
} as const;

export const ViewNames = {
  AutocompleteDemo: 'autocomplete-demo',
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
  Confidentiality: 'confidentiality',
  FDR: 'fdr',
  UploadDocuments: 'upload-documents',
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
  CaseRoles: '/case-users/search',
} as const;
