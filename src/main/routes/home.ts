import { Application } from 'express';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../app/auth/user/oidc';
import { getCaseApi } from '../app/case/case-api';

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
}
