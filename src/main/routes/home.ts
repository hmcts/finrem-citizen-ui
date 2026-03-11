import { Application } from 'express';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../app/auth/user/oidc';
import { getCaseApi } from '../app/case/case-api';
import { CaseAssignedUserRole } from '../app/case/case-roles';
import { CaseRole } from '../app/case/definition';
import { oidcMiddleware } from '../middleware';

export default function (app: Application): void {
  app.get('/', oidcMiddleware, (req, res) => {
    res.render('home');
  });

  app.get('/case/:caseReference', async (req, res) => {
    const { caseReference } = req.params;

    const logger: LoggerInstance = console as unknown as LoggerInstance;

    const systemUser = await getSystemUser();

    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const caseData = await caseworkerUserApi.getCaseById(caseReference);
    res.json(caseData);
  });

  app.get('/case/:caseReference/:userId/:caseRole', async (req, res) => {
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
}
