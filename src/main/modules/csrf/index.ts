import { csrfSync } from 'csrf-sync';
import { Application, NextFunction, Request, Response } from 'express';
import type { LoggerInstance } from 'winston';

import { RouteNames } from '../../common-constants';

const { Logger } = require('@hmcts/nodejs-logging');
const logger: LoggerInstance = Logger.getLogger('app');

const { csrfSynchronisedProtection } = csrfSync({
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],

  getTokenFromRequest: req => {
    const queryToken = req.query?._csrf;
    return (
      req.body?._csrf ||
      (req.headers['x-csrf-token'] as string) ||
      (Array.isArray(queryToken) ? queryToken[0] : queryToken)
    );
  },

  getTokenFromState: req => req.session.csrfToken,

  storeTokenInState: (req, token) => {
    req.session.csrfToken = token;
  },
});

export class CSRFToken {
  private static readonly VALIDATION_ERROR_CODE = 'EBADCSRFTOKEN';

  public enableFor(app: Application): void {
    app.use(csrfSynchronisedProtection);

    app.use((req: Request, res: Response, next: NextFunction) => {
      try {
        const token = req.csrfToken!();
        if (token) {
          res.locals.csrfToken = token;
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
      const csrfError = error as Error & { code?: string };

      if (csrfError.code === CSRFToken.VALIDATION_ERROR_CODE) {
        logger.error(`${csrfError.stack || csrfError}`);

        return res.redirect(RouteNames.csrfError);
      }
      next();
    });
  }
}
