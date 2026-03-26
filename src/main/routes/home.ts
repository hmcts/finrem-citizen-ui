import { Application } from 'express';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../app/auth/user';
import { getCaseApi } from '../app/case/case-api';
import { CaseAssignedUserRole } from '../app/case/case-roles';
import { CaseRole } from '../app/case/definition';
import { UserDetails } from '../app/controller/AppRequest';
import { RouteNames } from '../common-constants';
import { getHomePageForUser } from '../functions/util/commonUtil';
import { oidcMiddleware } from '../middleware';

export default function (app: Application): void {
  app.get(RouteNames.basePath, oidcMiddleware, async (req, res) => {
    const user = req.session.user as UserDetails;
    const userPageDetails = await getHomePageForUser(user);
    if(userPageDetails.caseData) {
      req.session.caseData = userPageDetails.caseData;
    }
    res.render(userPageDetails.url);
  });

  app.get(RouteNames.caseReference, async (req, res) => {
    const { caseReference } = req.params;

    const logger: LoggerInstance = console as unknown as LoggerInstance;

    const systemUser = await getSystemUser();

    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const caseData = await caseworkerUserApi.getCaseById(caseReference);
    res.json(caseData);
  });

  app.get(RouteNames.caseUserRole, async (req, res) => {
    const assignments: CaseAssignedUserRole[] = [
      {
        case_id: req.params.caseReference,
        user_id: req.params.userId,
        case_role: req.params.caseRole as CaseRole,
      },
    ];
    const logger: LoggerInstance = console as unknown as LoggerInstance;

    try {
      const systemUser = await getSystemUser();
      const caseworkerUserApi = getCaseApi(systemUser, logger);

      await caseworkerUserApi.addUsersToCase(assignments);

      return res.status(200).json({
        success: true,
        message: 'User successfully added to case.',
        data: assignments,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error adding user to case', { error: err.message });

      return res.status(500).json({
        success: false,
        message: 'Failed to add user to case.',
        error: err.message,
      });
    }
  });

  app.get(RouteNames.retrieveCase, async (req, res) => {

    const logger: LoggerInstance = console as unknown as LoggerInstance;
    const caseApi = getCaseApi(req.session.user as UserDetails, logger);
    const caseId = await caseApi.getExistingUserCase();
    res.json({ id: caseId });
  });
}
