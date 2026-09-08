import { EVENT_TYPE } from 'app/case/case-type';
import { Application, Request, Response } from 'express';

import { triggerSystemEvent } from '../../app/case/case-api';
import { AccessCodeCollection, CaseRole, FinremCaseData, YesOrNo } from '../../app/case/definition';
import { UserDetails } from '../../app/controller/AppRequest';
import { CaseUserNames, RouteNames, ViewNames } from '../../constants';
import { oidcMiddleware } from '../../middleware';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('enter-access-code');

interface AccessCodeError {
  accessCode?: string;
}

type EmailField = 'applicantEmail' | 'respondentEmail';
type AccessCodeField = 'applicantAccessCodes' | 'respondentAccessCodes';
type MatchingAccessCodeResult =
  | { match: AccessCodeCollection; role: CaseRole }
  | { errors: AccessCodeError };

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
    const caseNumber = req.session.caseNumber;
    const caseData = req.session.caseData;
    if (!caseNumber || !caseData) {
      logger.error('Case number or case data not found in session');
      return res.redirect(RouteNames.enterCaseNumber);
    }

    // Validate access code format
    const { accessCode } = req.body;
    const accessCodeFormatErrors = validateAccessCodeFormat(accessCode);
    if (accessCodeFormatErrors) {
      return res.render('enter-access-code', {
        errors: accessCodeFormatErrors,
        accessCode: accessCode || '',
      });
    }

    // Find matching access code in case data
    const trimmedAccessCode = accessCode.trim().toUpperCase();
    const caseAccessCodesByRole = getCaseAccessCodesByRole(caseData);
    const matchingAccessCode = findMatchingAccessCode(caseAccessCodesByRole, trimmedAccessCode);
    if ('errors' in matchingAccessCode) {
      return res.render('enter-access-code', {
        errors: { accessCode: matchingAccessCode.errors.accessCode || 'Access code does not match case number' },
        accessCode: accessCode || '',
      });
    }

    // All validations passed - proceed to dashboard
    logger.info('Access code validated successfully', { caseNumber });

    // Linking user to case
    try {
      const { match, role } = matchingAccessCode;
      const user = req.session.user as UserDetails | undefined;
      const accessCodeField = getAccessCodeCaseField(role);
      const accessCodesForRole = caseData[accessCodeField] as AccessCodeCollection[] | undefined;

      if (!accessCodesForRole?.length) {
        logger.error('Access code history missing for matched role', { role });
        return res.render(ViewNames.Error);
      }

      const linkingEventPayload: Partial<FinremCaseData> = {};
      const validatedAt = new Date().toISOString();
      linkingEventPayload[getEmailCaseField(role)] = user?.email;
      linkingEventPayload[accessCodeField] = accessCodesForRole.map(code => {
        if (code.id !== match.id || code.value.accessCode.toUpperCase() !== trimmedAccessCode) {
          return code;
        }

        return {
          ...code,
          value: {
            ...code.value,
            isValid: YesOrNo.NO,
            userIdamID: user?.id,
            usedAt: validatedAt,
          },
        };
      });

      const caseId = caseNumber?.replace(/-/g, '');
      req.session.caseData = await triggerSystemEvent(caseId, linkingEventPayload, role === CaseRole.APPLICANT ? EVENT_TYPE.LINK_APPLICANT_TO_CASE : EVENT_TYPE.LINK_RESPONDENT_TO_CASE, logger);

      req.session.caseRole = role;
      if (user) {
        user.caseRole = role;
      }

      // Set case user name based on role
      if (role === CaseRole.APPLICANT) {
        req.session.caseUserName = req.session.caseData.applicantFlags?.partyName || CaseUserNames.APPLICANT;
      } else if (role === CaseRole.RESPONDENT) {
        req.session.caseUserName = req.session.caseData.respondentFlags?.partyName || CaseUserNames.RESPONDENT;
      }
    } catch {
      return res.render(ViewNames.Error);
    }

    // TODO: Send confirmation email if this is a new account setup
    return res.redirect(RouteNames.dashboard);
  });
}

export function validateAccessCodeFormat(accessCode: string | undefined): AccessCodeError | null {
  const errors: AccessCodeError = {};

  if (!accessCode || !accessCode.trim()) {
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

export function findMatchingAccessCode(
  caseAccessCodesByRole: Record<CaseRole, AccessCodeCollection[]>,
  enteredAccessCode: string
): MatchingAccessCodeResult {
  for (const role in caseAccessCodesByRole) {
    const codes = caseAccessCodesByRole[role as CaseRole];
    const match = codes.find(ac => ac.value?.accessCode?.toUpperCase() === enteredAccessCode);

    if (!match) {
      continue;
    }

    if (match.value.isValid === YesOrNo.NO) {
      return { errors: { accessCode: 'The access code you entered has already been used, you should contact the court.' } };
    }

    return { match, role: role as CaseRole };
  }

  return { errors: { accessCode: 'Access code does not match case number' } };
}

function getCaseAccessCodesByRole(caseData: FinremCaseData) {
  return {
    [CaseRole.APPLICANT]: caseData.applicantAccessCodes || [],
    [CaseRole.RESPONDENT]: caseData.respondentAccessCodes || [],
  };
}

export function getEmailCaseField(caseRole: CaseRole): EmailField {
  return caseRole === CaseRole.APPLICANT ? 'applicantEmail' : 'respondentEmail';
}

export function getAccessCodeCaseField(caseRole: CaseRole): AccessCodeField {
  return caseRole === CaseRole.APPLICANT ? 'applicantAccessCodes' : 'respondentAccessCodes';
}
