export const RouteNames = {
  basePath: '/',
  caseUserRole: '/case/:caseReference/:userId/:caseRole',
  caseReference: '/case/:caseReference',
  enterCaseNumber: '/enter-case-number',
  dashboard: '/dashboard',
  enterAccessCode: '/enter-access-code',
  info: '/info',
  login: '/login',
  logout: '/logout',
  taskListUpload: '/task-list-upload-dashboard'
} as const;

