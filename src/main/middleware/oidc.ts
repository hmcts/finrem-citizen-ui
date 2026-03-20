import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { RouteNames } from '../route-names';

const PUBLIC_PATHS = [RouteNames.login, '/oauth2/callback', RouteNames.info, '/favicon.ico'];
const PUBLIC_PREFIXES = ['/health'];

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
    req.session.returnTo = req.originalUrl;
    req.session.save(() => {
      res.redirect(RouteNames.login);
    });
  } else {
    res.redirect(RouteNames.login);
  }
};
