import { Application } from 'express';
import { getSystemUser } from '../app/auth/user/oidc';
import { LoggerInstance } from 'winston';
import {getCaseApi} from "../app/case/case-api";

import { oidcMiddleware } from '../middleware';

export default function (app: Application): void {
  app.get('/', oidcMiddleware, (req, res) => {
    res.render('home');
  });

  app.get('/case/:caseReference', async(req, res) => {
    ///const { caseReference } = req.params;

    const logger: LoggerInstance = console as unknown as LoggerInstance;

    const systemUser = await getSystemUser();

    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const caseData = await caseworkerUserApi.getCaseById("1734026863049975");
    res.json(caseData);

  });
}
