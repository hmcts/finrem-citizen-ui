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
    console.log('caseApi:::', caseData);
    res.json(caseData);
  });

  app.get('/case/:caseReference/:userId/:caseRole', async (req, _res) => {
    const assignments: CaseAssignedUserRole[] = [
      {
        case_id: req.params.caseReference,
        user_id: req.params.userId,
        case_role: req.params.caseRole as CaseRole,
      },
    ];
    const logger: LoggerInstance = console as unknown as LoggerInstance;

    const systemUser = await getSystemUser();

    const caseworkerUserApi = getCaseApi(systemUser, logger);
    await caseworkerUserApi.addUsersToCase(assignments);
  });
}
