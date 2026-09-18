import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { PublicRoutes, RouteNames } from '../constants';

const NEW_USER_CASE_LINKING_ROUTES: ReadonlySet<string> = new Set([
  RouteNames.enterCaseNumber,
  RouteNames.enterAccessCode,
]);

const NEW_USER_ALLOWED_ROUTES: ReadonlySet<string> = new Set([
  ...Object.values(PublicRoutes),
  ...NEW_USER_CASE_LINKING_ROUTES,
]);

export const routeAccessMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session?.user) {
    return next();
  }

  const requestPath = req.path || req.originalUrl;
  const userIsLinkedToCase = hasCaseNumberAndRole(req);

  if (userIsLinkedToCase && isAccessingCaseLinkingRoutes(requestPath)) {
    return res.redirect(RouteNames.dashboard);
  }

  if (!userIsLinkedToCase && !isAccessingNewUserRoute(requestPath)) {
    return res.redirect(RouteNames.enterCaseNumber);
  }

  return next();
};

function hasCaseNumberAndRole(req: Request): boolean {
  const caseNumber = req.session?.caseNumber?.trim();
  const caseRole = req.session?.user?.caseRole || req.session?.caseRole;

  return Boolean(caseNumber && caseRole);
}

function isAccessingCaseLinkingRoutes(requestPath: string): boolean {
  return NEW_USER_CASE_LINKING_ROUTES.has(requestPath);
}

function isAccessingNewUserRoute(requestPath: string): boolean {
  return NEW_USER_ALLOWED_ROUTES.has(requestPath);
}
