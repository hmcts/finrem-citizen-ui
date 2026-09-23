import { csrfSync } from 'csrf-sync';
import { Application, NextFunction, Request, Response } from 'express';

type CsrfLikeError = Error & {
  code?: string;
  status?: number;
  statusCode?: number;
  name?: string;
};

export class CSRFToken {
  public static readonly VALIDATION_ERROR_CODE = 'EBADCSRFTOKEN';

  public enableFor(app: Application): void {
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
      getTokenFromState: req => req.session?.csrfToken,
      storeTokenInState: (req, token) => {
        if (req.session) {req.session.csrfToken = token;}
      },
    });

    app.use(csrfSynchronisedProtection);

    app.use((req: Request, res: Response, next: NextFunction) => {
      const token = req.csrfToken?.();
      if (token) {
        res.locals.csrfToken = token;
      }
      next();
    });

    app.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
      const csrfError = error as CsrfLikeError;

      const isCsrf =
        csrfError?.code === CSRFToken.VALIDATION_ERROR_CODE;

      if (isCsrf) {
        csrfError.code = CSRFToken.VALIDATION_ERROR_CODE;
        csrfError.status = 403;
        csrfError.statusCode = 403;
      }

      next(csrfError);
    });
  }
}
