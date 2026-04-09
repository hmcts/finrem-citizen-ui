
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
  // getCaseRole: '/getCaseRole/:caseReference/:userId',
  getCaseRole: '/getCaseRole',
  enterCaseNumber: '/enter-case-number',
  dashboard: '/dashboard',
  enterAccessCode: '/enter-access-code',
  taskListUpload: '/task-list-upload-dashboard',
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
  Error: 'error',
  NotFound: 'not-found',
  TaskListUploadDashboard: 'task-list-upload-dashboard'
};
