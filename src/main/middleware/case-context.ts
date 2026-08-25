import { Logger } from '@hmcts/nodejs-logging';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { LoggerInstance } from 'winston';

import { RouteNames } from '../common-constants';
import { hydrateUserSessionWithCaseContext } from '../functions/util/homePageUtil';

const logger = Logger.getLogger('case-context-middleware') as unknown as LoggerInstance;
const PUBLIC_PATHS = [RouteNames.login, RouteNames.callbackUrl, RouteNames.logout, RouteNames.info, '/favicon.ico'];
const PUBLIC_PREFIXES = [RouteNames.health];

export const caseContextMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestPath = req.path || req.originalUrl;
  const isPublicPath =
    PUBLIC_PATHS.includes(requestPath) || PUBLIC_PREFIXES.some(prefix => requestPath.startsWith(prefix));

  if (isPublicPath || !req.session?.user) {
    return next();
  }

  const userId = req.session.user.id || req.session.user.sub;
  const hasCaseContext = Boolean(req.session.caseNumber?.trim()) || req.session.caseData !== undefined;
  const alreadyHydratedForUser = req.session.caseContextHydratedUserId === userId;

  if (alreadyHydratedForUser || hasCaseContext) {
    return next();
  }

  try {
    await hydrateUserSessionWithCaseContext(req.session, logger);
    req.session.caseContextHydratedUserId = userId;
    return next();
  } catch (error) {
    logger.error('Failed to hydrate case context in middleware:', error);
    req.session.destroy(() => {
      res.redirect(RouteNames.logout);
    });
  }
};
