export const RouteNames = {
  basePath: '/',
  callbackUrl: '/oauth2/callback',
  caseUserRole: '/case/:caseReference/:userId/:caseRole',
  caseReference: '/case/:caseReference',
  enterCaseNumber: '/enter-case-number',
  dashboard: '/dashboard',
  enterAccessCode: '/enter-access-code',
  health: '/health',
  info: '/info',
  login: '/login',
  logout: '/logout',
  taskListUpload: '/task-list-upload-dashboard'
} as const;

