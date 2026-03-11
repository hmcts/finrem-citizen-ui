import type { NextFunction, Request, RequestHandler, Response } from 'express';

const PUBLIC_PATHS = ['/login', '/oauth2/callback', '/info', '/favicon.ico'];
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
      res.redirect('/login');
    });
  } else {
    res.redirect('/login');
  }
};
