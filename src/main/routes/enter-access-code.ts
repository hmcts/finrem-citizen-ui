import { Application, Request, Response } from 'express';

import { getSystemUser } from '../app/auth/user';
import { getCaseApi } from '../app/case/case-api';
import { oidcMiddleware } from '../middleware';
import { RouteNames } from '../route-names';

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
    errors.accessCode = 'Access code must only include letters a-z, and numbers 0-9';
    return errors;
  }

  return null;
}

export default function setupEnterAccessCodeRoute(app: Application): void {
  app.get(RouteNames.enterAccessCode, oidcMiddleware, (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user?.accessToken) {
      return res.redirect('/oauth2/login');
    }

    // Check if case number exists in session
    if (!req.session.caseNumber) {
      return res.redirect(RouteNames.enterCaseNumber);
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

  app.post(RouteNames.enterAccessCode, oidcMiddleware, async (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user?.accessToken) {
      return res.redirect('/oauth2/login');
    }

    // Check if case number exists in session
    if (!req.session.caseNumber) {
      return res.redirect(RouteNames.enterCaseNumber);
    }

    const { accessCode } = req.body;

    // Validate access code format
    const validationErrors = validateAccessCode(accessCode);
    if (validationErrors) {
      req.session.accessCodeErrors = validationErrors;
      req.session.tempAccessCode = accessCode || '';
      return res.redirect(RouteNames.enterAccessCode);
    }

    const trimmedAccessCode = accessCode.trim().toUpperCase();

    try {
      // Get case data from CCD backend
      const caseNumber = req.session.caseNumber!;
      // Remove hyphens to get the actual case ID for CCD
      const caseId = caseNumber.replace(/-/g, '');
      
      const systemUser = await getSystemUser();
      const caseApi = getCaseApi(systemUser, logger);
      const caseData = await caseApi.getCaseById(caseId);

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
        return res.redirect(RouteNames.enterAccessCode);
      }

      // Access code has expired
      const validUntilDate = new Date(matchingAccessCode.value.validUntil);
      const now = new Date();
      
      if (now > validUntilDate) {
        req.session.accessCodeErrors = {
          accessCode: 'The access code you entered has expired. Contact the court to get a new code',
        };
        req.session.tempAccessCode = accessCode || '';
        return res.redirect(RouteNames.enterAccessCode);
      }

      // Access code has already been used (check isValid flag)
      if (matchingAccessCode.value.isValid === 'No') {
        req.session.accessCodeErrors = {
          accessCode: 'The access code you entered has already been used, you should contact the court.',
        };
        req.session.tempAccessCode = accessCode || '';
        return res.redirect(RouteNames.enterAccessCode);
      }

      // All validations passed - store access code and proceed
      req.session.accessCode = trimmedAccessCode;
      
      logger.info('Access code validated successfully', {
        caseNumber: req.session.caseNumber,
        accessCode: trimmedAccessCode,
      });

      // TODO: Mark access code as used in CCD (update isValid to 'No')
      // TODO: Send confirmation email if this is a new account setup
      
      return res.redirect(RouteNames.dashboard);
    } catch (error) {
      const err = error as Error;
      logger.error('Error validating access code', { error: err.message });
      
      // Handle case not found or other CCD errors
      req.session.accessCodeErrors = {
        accessCode: 'Access code does not match case number',
      };
      req.session.tempAccessCode = accessCode || '';
      
      return res.redirect(RouteNames.enterAccessCode);
    }
  });
}
