import * as express from 'express';
import helmet from 'helmet';
import type { IncomingMessage, ServerResponse } from 'http';

const googleAnalyticsDomain = 'https://*.google-analytics.com';
const googleAnalyticsDataDomain = 'https://*.analytics.google.com';
const googleTagManagerDomain = 'https://www.googletagmanager.com';
const googleTagManagerWildcardDomain = 'https://*.googletagmanager.com';
const self = "'self'";

const getNonceDirective = (_req: IncomingMessage, res: ServerResponse): string => {
  const { cspNonce } = (res as express.Response).locals;

  return `'nonce-${cspNonce}'`;
};

/**
 * Module that enables helmet in the application
 */
export class Helmet {
  private readonly developmentMode: boolean;
  constructor(developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  public enableFor(app: express.Express): void {
    // include default helmet functions
    const scriptSrc = [
      self,
      googleTagManagerDomain,
      googleTagManagerWildcardDomain,
      getNonceDirective,
      "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='", // GOV.UK Frontend v6.1.0 inline script
    ];

    if (this.developmentMode) {
      // Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval'
      // is not an allowed source of script in the following Content Security Policy directive:
      // "script-src 'self' https://www.googletagmanager.com 'nonce-...'".
      // seems to be related to webpack
      scriptSrc.push("'unsafe-eval'");
    }

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            connectSrc: [self, googleAnalyticsDomain, googleAnalyticsDataDomain, googleTagManagerDomain, googleTagManagerWildcardDomain],
            defaultSrc: ["'none'"],
            fontSrc: [self, 'data:'],
            frameSrc: [googleTagManagerDomain],
            imgSrc: [self, googleAnalyticsDomain, googleTagManagerDomain, googleTagManagerWildcardDomain],
            objectSrc: [self],
            scriptSrc,
            styleSrc: [self],
          },
        },
        referrerPolicy: { policy: 'origin' },
      })
    );
  }
}
