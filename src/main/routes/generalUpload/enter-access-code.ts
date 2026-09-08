import { Application, Request, Response } from 'express';

import { triggerSystemEvent } from '../../app/case/case-api';
import { EVENT_TYPE } from '../../app/case/case-type';
import { CaseRole } from '../../app/case/definition';
import { UserDetails } from '../../app/controller/AppRequest';
import { CaseUserNames, RouteNames, ViewNames } from '../../constants';
import {
  buildLinkingEventPayload,
  findMatchingAccessCode,
  getCaseAccessCodesByRole,
  validateAccessCodeFormat,
} from '../../functions/util/accessCodeUtil';
import { oidcMiddleware } from '../../middleware';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('enter-access-code');

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
    const formatErrors = validateAccessCodeFormat(accessCode);
    if (formatErrors) {
      return res.render('enter-access-code', { errors: formatErrors, accessCode: accessCode || '' });
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
      const linkingEventPayload = buildLinkingEventPayload({
        matchingAccessCode: { match, role },
        caseAccessCodesByRole,
        userId: user?.id,
        userEmail: user?.email,
        validatedAt: new Date().toISOString(),
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
