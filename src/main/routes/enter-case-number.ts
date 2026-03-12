import { Application, Request, Response } from 'express';

import 'express-session';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('enter-case-number');

declare module 'express-session' {
  interface SessionData {
    caseNumber?: string;
    caseNumberErrors?: CaseNumberError;
    tempCaseNumber?: string;
  }
}

interface CaseNumberError {
  caseNumber?: string;
}

export function validateCaseNumber(caseNumber: string | undefined): CaseNumberError | null {
  const errors: CaseNumberError = {};

  // Required validation
  if (!caseNumber || typeof caseNumber !== 'string' || !caseNumber.trim()) {
    errors.caseNumber = 'Enter case number';
    return errors;
  }

  const trimmedCaseNumber = caseNumber.trim();

  // Length validation (16-20 characters total)
  if (trimmedCaseNumber.length < 16 || trimmedCaseNumber.length > 20) {
    errors.caseNumber = 'Case number must be between 16 and 20 characters';
    return errors;
  }

  // Format validation (only numbers and hyphens)
  const formatRegex = /^[0-9-]+$/;
  if (!formatRegex.test(trimmedCaseNumber)) {
    errors.caseNumber = 'Case number must only include numbers 0 to 9 and special characters such as hyphens';
    return errors;
  }

  // Digit count validation (must be exactly 16 digits)
  const digitsOnly = trimmedCaseNumber.replace(/-/g, '');
  if (digitsOnly.length !== 16) {
    errors.caseNumber = 'Case number must be 16 digits';
    return errors;
  }

  return null;
}

export default function setupEnterCaseNumberRoute(app: Application): void {
  app.get('/enter-case-number', (req: Request, res: Response) => {
    // Retrieve any errors from session (set by POST handler)
    const errors = req.session.caseNumberErrors;
    delete req.session.caseNumberErrors;

    // Retrieve previously entered value to preserve on error
    const caseNumber = req.session.tempCaseNumber || '';
    delete req.session.tempCaseNumber;

    res.render('enter-case-number', {
      errors,
      caseNumber,
    });
  });

  app.post('/enter-case-number', (req: Request, res: Response) => {
    const caseNumber = req.body.caseNumber;

    // Validate the case number
    const errors = validateCaseNumber(caseNumber);

    if (errors) {
      // Store errors and input value in session for redirect
      req.session.caseNumberErrors = errors;
      req.session.tempCaseNumber = caseNumber || '';
      
      req.session.save((err) => {
        if (err) {
          logger.error('Session save error:', err);
        }
        res.redirect('/enter-case-number');
      });
      return;
    }

    // Save the validated case number to session
    req.session.caseNumber = caseNumber.trim();

    req.session.save((err) => {
      if (err) {
        logger.error('Session save error:', err);
      }
      // Redirect to next step in the journey
      res.redirect('/enter-access-code');
    });
  });
};
