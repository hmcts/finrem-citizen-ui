import { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../common-constants';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('csrf-error');

export default function setupCsrfErrorRoute(app: Application): void {
  app.get(RouteNames.csrfError, (_req: Request, res: Response) => {
    logger.error('CSRF Token Validation Failed');
    res.status(400).render(ViewNames.Error);
  });
}
