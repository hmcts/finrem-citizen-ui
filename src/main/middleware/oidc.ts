import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const oidcMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session?.user) {
    return next();
  }

  if (req.session) {
    req.session.returnTo = req.originalUrl;
  }
  res.redirect('/login');
};
