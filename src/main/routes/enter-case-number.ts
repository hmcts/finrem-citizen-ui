import { Application, Request, Response } from 'express';

import 'express-session';

import caseService from '../services/caseService';

declare module 'express-session' {
  interface SessionData {
    caseNumber?: string;
    hasLinkedCase?: boolean;
    caseNumberErrors?: CaseNumberError;
    tempCaseNumber?: string;
    userId?: string;
  }
}

interface CaseNumberError {
  caseNumber?: string;
}

function validateCaseNumber(caseNumber: string | undefined): CaseNumberError | null {
  const errors: CaseNumberError = {};

  // Required validation
  if (!caseNumber || typeof caseNumber !== 'string' || !caseNumber.trim()) {
    errors.caseNumber = 'Enter case number';
    return errors;
  }

  const trimmedCaseNumber = caseNumber.trim();

  // Length validation (16-20 characters)
  if (trimmedCaseNumber.length < 16 || trimmedCaseNumber.length > 20) {
    errors.caseNumber = 'Case number must be between 16 and 20 characters';
    return errors;
  }

  // Format validation (only numbers and hyphens)
  const formatRegex = /^[0-9-]{16,20}$/;
  if (!formatRegex.test(trimmedCaseNumber)) {
    errors.caseNumber = 'Case number must only include numbers 0 to 9 and special characters such as hyphens';
    return errors;
  }

  return null;
}

async function userHasLinkedCase(req: Request): Promise<boolean> {
  // Check if user ID exists in session (set after authentication)
  const userId = req.session.userId;
  
  if (!userId) {
    return false;
  }

  // Call backend service to check if user has a linked case
  try {
    return await caseService.checkUserHasLinkedCase(userId);
  } catch {
    // On error, allow user to proceed with entering case number
    return false;
  }
}

export default (app: Application): void => {
  app.get('/enter-case-number', async (req: Request, res: Response) => {
    // Skip logic: if user already has linked case, redirect to dashboard
    if (await userHasLinkedCase(req)) {
      return res.redirect('/dashboard');
    }

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
      
      req.session.save(() => {
        res.redirect('/enter-case-number');
      });
      return;
    }

    // Save the validated case number to session
    req.session.caseNumber = caseNumber.trim();

    req.session.save(() => {
      // Redirect to next step in the journey
      res.redirect('/enter-access-code');
    });
  });
};
