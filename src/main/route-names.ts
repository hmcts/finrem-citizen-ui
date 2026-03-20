export const PublicRoutes = {
  basePath: '/',
  callbackUrl: '/oauth2/callback',
  health: '/health',
  info: '/info',
  login: '/login',
  logout: '/logout',
} as const;

export const PrivateRoutes = {
  caseUserRole: '/case/:caseReference/:userId/:caseRole',
  caseReference: '/case/:caseReference',
  enterCaseNumber: '/enter-case-number',
  dashboard: '/dashboard',
  enterAccessCode: '/enter-access-code',
  taskListUpload: '/task-list-upload-dashboard',
} as const;

export const RouteNames = {
  ...PublicRoutes,
  ...PrivateRoutes,
} as const;
