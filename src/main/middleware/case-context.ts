import { Logger } from '@hmcts/nodejs-logging';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { LoggerInstance } from 'winston';

import { RouteNames } from '../constants';
import { hydrateUserSessionWithCaseContext } from '../functions/util/homePageUtil';

const logger = Logger.getLogger('case-context-middleware') as unknown as LoggerInstance;
const LINKING_PATHS: string[] = [RouteNames.enterAccessCode, RouteNames.enterCaseNumber];
const EXCLUDED_PATHS: string[] = [RouteNames.logout, ...LINKING_PATHS];

export const caseContextMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.session?.user) {
    return next();
  }

  const requestPath = req.path || req.originalUrl;
  const isExcludedPath = EXCLUDED_PATHS.includes(requestPath);

  if (isExcludedPath) {
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
