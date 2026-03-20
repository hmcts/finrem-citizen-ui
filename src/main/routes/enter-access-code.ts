import { Application, Request, Response } from 'express';

import { RouteNames } from '../route-names';

import { getMockCaseData, isMockEnabled } from '../app/case/mock-case-data';
import { oidcMiddleware } from '../middleware';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('enter-access-code');

declare module 'express-session' {
  interface SessionData {
    accessCode?: string;
    accessCodeErrors?: AccessCodeError;
    tempAccessCode?: string;
  }
}

interface AccessCodeError {
  accessCode?: string;
}

export function validateAccessCode(accessCode: string | undefined): AccessCodeError | null {
  const errors: AccessCodeError = {};

  if (!accessCode || typeof accessCode !== 'string' || !accessCode.trim()) {
    errors.accessCode = 'Enter your access code';
    return errors;
  }

  const trimmedAccessCode = accessCode.trim();

  // Length validation (must be exactly 8 characters)
  if (trimmedAccessCode.length !== 8) {
    errors.accessCode = 'Access code must be 8 characters';
    return errors;
  }

  // Format validation (only letters a-z and numbers 0-9)
  const formatRegex = /^[a-zA-Z0-9]+$/;
  if (!formatRegex.test(trimmedAccessCode)) {
    errors.accessCode = 'Access code must include letters a-z, and numbers 0-9';
    return errors;
  }

  return null;
}

export default function setupEnterAccessCodeRoute(app: Application): void {
  app.get(RouteNames.enterAccessCode, (req: Request, res: Response) => {
    res.render('enter-access-code');
  app.get('/enter-access-code', oidcMiddleware, (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user?.accessToken) {
      return res.redirect('/oauth2/login');
    }

    // Check if case number exists in session
    if (!req.session.caseNumber) {
      return res.redirect('/enter-case-number');
    }

    const errors = req.session.accessCodeErrors;
    const accessCode = req.session.tempAccessCode;

    // Clear session errors and temp data
    delete req.session.accessCodeErrors;
    delete req.session.tempAccessCode;

    res.render('enter-access-code', {
      errors,
      accessCode,
    });
  });

  app.post('/enter-access-code', oidcMiddleware, async (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user?.accessToken) {
      return res.redirect('/oauth2/login');
    }

    // Check if case number exists in session
    if (!req.session.caseNumber) {
      return res.redirect('/enter-case-number');
    }

    const { accessCode } = req.body;

    // Validate access code format
    const validationErrors = validateAccessCode(accessCode);
    if (validationErrors) {
      req.session.accessCodeErrors = validationErrors;
      req.session.tempAccessCode = accessCode || '';
      return res.redirect('/enter-access-code');
    }

    const trimmedAccessCode = accessCode.trim().toUpperCase();

    try {
      // Get case data from CCD (or use mock for local development)
      const caseNumber = req.session.caseNumber!;
      let caseData;
      
      if (isMockEnabled()) {
        // Use mock data for local development
        logger.info('MOCK_CCD enabled - using mock data for access code validation');
        caseData = getMockCaseData(caseNumber);
      } else {
        // Use real CCD backend
        const userDetails = req.session.user!;
        const caseApi = require('../app/case/case-api').getCaseApi(userDetails, logger);
        caseData = await caseApi.getCaseById(caseNumber);
      }

      // Validate access code against CCD
      const allAccessCodes = [
        ...(caseData.applicantAccessCodes || []),
        ...(caseData.respondentAccessCodes || []),
      ];

      const matchingAccessCode = allAccessCodes.find(
        (ac) => ac.value.accessCode?.toUpperCase() === trimmedAccessCode
      );

      // Access code does not match case number
      if (!matchingAccessCode) {
        req.session.accessCodeErrors = {
          accessCode: 'Access code does not match case number',
        };
        req.session.tempAccessCode = accessCode || '';
        return res.redirect('/enter-access-code');
      }

      // Access code has expired
      const validUntilDate = new Date(matchingAccessCode.value.validUntil);
      const now = new Date();
      
      if (now > validUntilDate) {
        req.session.accessCodeErrors = {
          accessCode: 'The access code you entered has expired. Contact the court to get a new code',
        };
        req.session.tempAccessCode = accessCode || '';
        return res.redirect('/enter-access-code');
      }

      // Access code has already been used (check isValid flag)
      if (matchingAccessCode.value.isValid === 'No') {
        req.session.accessCodeErrors = {
          accessCode: 'The access code you entered has already been used, you should contact the court.',
        };
        req.session.tempAccessCode = accessCode || '';
        return res.redirect('/enter-access-code');
      }

      // All validations passed - store access code and proceed
      req.session.accessCode = trimmedAccessCode;
      
      logger.info('Access code validated successfully', {
        caseNumber: req.session.caseNumber,
        accessCode: trimmedAccessCode,
      });

      // TODO: Mark access code as used in CCD (update isValid to 'No')
      // TODO: Send confirmation email if this is a new account setup
      
      return res.redirect('/dashboard');
    } catch (error) {
      const err = error as Error;
      logger.error('Error validating access code', { error: err.message });
      
      // Handle case not found or other CCD errors
      req.session.accessCodeErrors = {
        accessCode: 'Access code does not match case number',
      };
      req.session.tempAccessCode = accessCode || '';
      
      return res.redirect('/enter-access-code');
    }
  });
}
