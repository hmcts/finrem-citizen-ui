import { Application, Request, Response } from 'express';

import 'express-session';

import { getSystemUser } from '../app/auth/user';
import { getCaseApi } from '../app/case/case-api';
import { FinremCaseData } from '../app/case/definition';
import { getMockCaseData, isMockEnabled } from '../app/case/mock-case-data';
import { oidcMiddleware } from '../middleware';
import { RouteNames } from '../route-names';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('enter-case-number');

declare module 'express-session' {
  interface SessionData {
    caseNumber?: string;
    caseNumberErrors?: CaseNumberError;
    tempCaseNumber?: string;
    caseData?: FinremCaseData;
  }
}

interface CaseNumberError {
  caseNumber?: string;
}

export function validateCaseNumber(caseNumber: string | undefined): CaseNumberError | null {
  const errors: CaseNumberError = {};

  // Required validation
  if (!caseNumber || typeof caseNumber !== 'string' || !caseNumber.trim()) {
    errors.caseNumber = 'Enter your case number';
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
  app.get(RouteNames.enterCaseNumber, oidcMiddleware, (req: Request, res: Response) => {
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

  app.post(RouteNames.enterCaseNumber, async (req: Request, res: Response) => {
    const caseNumber = req.body.caseNumber;

    // Validate the case number format
    const errors = validateCaseNumber(caseNumber);

    if (errors) {
      // Store errors and input value in session for redirect
      req.session.caseNumberErrors = errors;
      req.session.tempCaseNumber = caseNumber || '';

      req.session.save(err => {
        if (err) {
          logger.error('Session save error:', err);
        }
        res.redirect(RouteNames.enterCaseNumber);
      });
      return;
    }

    // Remove hyphens to get the actual case ID for CCD
    const caseId = caseNumber.trim().replace(/-/g, '');

    // User must be authenticated to validate case against CCD
    if (!req.session.user?.accessToken) {
      logger.error('User not authenticated when attempting to validate case number');
      return res.redirect('/oauth2/login');
    }

    // Validate case exists in CCD backend (or use mock for local development)
    let caseData: FinremCaseData;
    
    if (isMockEnabled()) {
      // Use mock data for local development
      logger.info(`MOCK_CCD enabled - using mock data for case ${caseId}`);
      try {
        caseData = getMockCaseData(caseId);
        logger.info(`Mock case ${caseId} found`);
      } catch (error) {
        logger.error(`Mock case ${caseId} not found:`, error);
        req.session.caseNumberErrors = {
          caseNumber: 'We cannot find that case number, Enter the case number that you received from the court',
        };
        req.session.tempCaseNumber = caseNumber || '';
        req.session.save(err => {
          if (err) {
            logger.error('Session save error:', err);
          }
          res.redirect(RouteNames.enterCaseNumber);
        });
        return;
      }
    } else {
      // Use real CCD backend
      const ccdUrl = require('config').get('services.case.url');
      logger.info(`User authenticated - validating case ${caseId} against CCD backend: ${ccdUrl}`);
      try {
        const systemUser = await getSystemUser();
        const caseApi = getCaseApi(systemUser, logger);
        caseData = await caseApi.getCaseById(caseId);
        logger.info(`Case ${caseId} found in CCD`);
      } catch (error) {
        logger.error(`Case ${caseId} not found in CCD:`, error);
        req.session.caseNumberErrors = {
          caseNumber: 'We cannot find that case number, Enter the case number that you received from the court',
        };
        req.session.tempCaseNumber = caseNumber || '';
        req.session.save(err => {
          if (err) {
            logger.error('Session save error:', err);
          }
          res.redirect(RouteNames.enterCaseNumber);
        });
        return;
      }
    }

    // Store case data in session for later use
    req.session.caseData = caseData;

    // Save the validated case number to session
    req.session.caseNumber = caseNumber.trim();

    req.session.save(err => {
      if (err) {
        logger.error('Session save error:', err);
      }
      // Redirect to next step in the journey
      res.redirect(RouteNames.enterAccessCode);
    });
  });
}
