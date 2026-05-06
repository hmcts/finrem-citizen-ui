import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to add contact email to response locals for use in templates
 */
export function contactEmailMiddleware(req: Request, res: Response, next: NextFunction): void {
  const caseData = req.session?.caseData;
  res.locals.contactEmail = caseData?.consentOrderFRCEmail || 'FRCexample@justice.gov.uk';
  next();
}
