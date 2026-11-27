import { NextFunction, Request, Response } from 'express';

import { resolveContactEmail } from '../functions/util/contactEmail';

/**
 * Middleware to add contact email to response locals for use in templates
 */
export function contactEmailMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.locals.contactEmail = resolveContactEmail(req);
  next();
}
