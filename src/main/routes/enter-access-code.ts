import { Application, Request, Response } from 'express';

import { getSystemUser } from '../app/auth/user';
import { getCaseApi } from '../app/case/case-api';
import { CaseAssignedUserRole } from '../app/case/case-roles';
import { AccessCodeCollection, CaseRole, FinremCaseData } from '../app/case/definition';
import { UserDetails } from '../app/controller/AppRequest';
import { RouteNames, ViewNames } from '../common-constants';
import { oidcMiddleware } from '../middleware';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('enter-access-code');

interface AccessCodeError {
  accessCode?: string;
}

interface AccessCodeValidationResult {
  isValid: boolean;
  error?: string;
}

export function retrieveCaseData(caseData: FinremCaseData | undefined): FinremCaseData | null {
  if (!caseData) {
    return null;
  }
  return caseData;
}

export function getMatchingAccessCode(
  caseData: FinremCaseData,
  accessCode: string
): { match: AccessCodeCollection; role: CaseRole } | null {
  const trimmedAccessCode = accessCode.trim().toUpperCase();

  const applicantCodes = caseData.applicantAccessCodes || [];
  const respondentCodes = caseData.respondentAccessCodes || [];

  const applicantMatch = applicantCodes.find(
    ac => ac.value?.accessCode?.toUpperCase() === trimmedAccessCode
  );

  if (applicantMatch) {
    return { match: applicantMatch, role: CaseRole.APPLICANT };
  }

  const respondentMatch = respondentCodes.find(
    ac => ac.value?.accessCode?.toUpperCase() === trimmedAccessCode
  );

  if (respondentMatch) {
    return { match: respondentMatch, role: CaseRole.RESPONDENT };
  }

  return null;
}

export function validateAccessCodeAgainstCase(
  matchingAccessCode: AccessCodeCollection
): AccessCodeValidationResult {
  // Check if access code has expired
  const validUntilDate = new Date(matchingAccessCode.value.validUntil);
  const now = new Date();
  
  if (now > validUntilDate) {
    return {
      isValid: false,
      error: 'The access code you entered has expired. Contact the court to get a new code',
    };
  }

  // Check if access code has already been used
  if (matchingAccessCode.value.isValid === 'No') {
    return {
      isValid: false,
      error: 'The access code you entered has already been used, you should contact the court.',
    };
  }

  return { isValid: true };
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

export async function addUserToCaseForRole(caseId: string, userId: string, caseRole: CaseRole): Promise<void> {
  try {
    const systemUser = await getSystemUser();
    const caseworkerUserApi = getCaseApi(systemUser, logger);

    const assignments: CaseAssignedUserRole[] = [
      {
        case_id: caseId,
        user_id: userId,
        case_role: caseRole,
      },
    ];

    await caseworkerUserApi.addUsersToCase(assignments);

    logger.info('Successfully added user to case', {
      caseId,
      userId,
      caseRole,
    });

  } catch (error) {
    const err = error as Error;
    logger.error('Error adding user to case', {
      caseId,
      userId,
      caseRole,
      error: err.message,
    });
    throw err;
  }
}

export default function setupEnterAccessCodeRoute(app: Application): void {
  app.get(RouteNames.enterAccessCode, oidcMiddleware, (req: Request, res: Response) => {
    // Check if case number exists in session
    if (!req.session.caseNumber) {
      return res.redirect(RouteNames.enterCaseNumber);
    }

    res.render(ViewNames.EnterAccessCode);
  });

  app.post(RouteNames.enterAccessCode, oidcMiddleware, async (req: Request, res: Response) => {
    // Check if case number exists in session
    if (!req.session.caseNumber) {
      return res.redirect(RouteNames.enterCaseNumber);
    }

    const { accessCode } = req.body;

    // Validate access code format
    const validationErrors = validateAccessCode(accessCode);
    if (validationErrors) {
      return res.render('enter-access-code', {
        errors: validationErrors,
        accessCode: accessCode || '',
      });
    }

    const trimmedAccessCode = accessCode.trim().toUpperCase();

    try {
      // Retrieve case data from session
      const caseData = retrieveCaseData(req.session.caseData);
      
      if (!caseData) {
        logger.error('Case data not found in session');
        return res.redirect(RouteNames.enterCaseNumber);
      }

      // Get matching access code from case data
      const matchingAccessCode = getMatchingAccessCode(caseData, trimmedAccessCode);

      if (!matchingAccessCode) {
        return res.render('enter-access-code', {
          errors: { accessCode: 'Access code does not match case number' },
          accessCode: accessCode || '',
        });
      }
      const { match, role } = matchingAccessCode;

      // Validate access code against case (expiry and usage)
      const validationResult = validateAccessCodeAgainstCase(match);

      if (!validationResult.isValid) {
        return res.render('enter-access-code', {
          errors: { accessCode: validationResult.error! },
          accessCode: accessCode || '',
        });
      }

      // All validations passed - proceed to dashboard
      logger.info('Access code validated successfully', {
        caseNumber: req.session.caseNumber,
        accessCode: trimmedAccessCode,
      });
      
      // Assigning user to case
      const user = req.session.user as UserDetails;
      try {
        await addUserToCaseForRole(req.session.caseNumber, user.uid as string, role);
      } catch {
        res.render(ViewNames.Error);
      } 


      // TODO: Mark access code as used in CCD (update isValid to 'No')
      // TODO: Send confirmation email if this is a new account setup
      
      return res.redirect(RouteNames.dashboard);
    } catch (error) {
      const err = error as Error;
      logger.error('Error validating access code', { error: err.message });
      
      // Handle case not found or other CCD errors
      return res.render('enter-access-code', {
        errors: { accessCode: 'Access code does not match case number' },
        accessCode: accessCode || '',
      });
    }
  });
}
