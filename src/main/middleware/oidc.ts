import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { PublicRoutes, RouteNames } from '../common-constants';

const PUBLIC_PATHS: string[] = [RouteNames.login, RouteNames.callbackUrl, RouteNames.info, PublicRoutes.favicon];
const PUBLIC_PREFIXES: string[] = [RouteNames.health];

export const oidcMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const requestPath = req.path || req.originalUrl;
  const isPublicPath =
    PUBLIC_PATHS.includes(requestPath) || PUBLIC_PREFIXES.some(prefix => requestPath.startsWith(prefix));

  if (isPublicPath) {
    return next();
  }

  if (req.session?.user) {
    return next();
  }

  if (req.session) {
    req.session.save(() => {
      res.redirect(RouteNames.login);
    });
  } else {
    res.redirect(RouteNames.login);
  }
};
