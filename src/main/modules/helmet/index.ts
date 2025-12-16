import * as express from 'express';
import helmet from 'helmet';

const googleAnalyticsDomain = '*.google-analytics.com';
const self = "'self'";

/**
 * Module that enables helmet in the application
 */
export class Helmet {
  private readonly developmentMode: boolean;
  constructor(developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  public enableFor(app: express.Express): void {
    if (this.developmentMode) {
      // Disable CSP entirely in development mode for easier local testing
      app.use(
        helmet({
          contentSecurityPolicy: false,
          referrerPolicy: { policy: 'origin' },
        })
      );
    } else {
      // Production mode: enable strict CSP
      const scriptSrc = [self, googleAnalyticsDomain, "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='"];

      app.use(
        helmet({
          contentSecurityPolicy: {
            directives: {
              connectSrc: [self],
              defaultSrc: ["'none'"],
              fontSrc: [self, 'data:'],
              imgSrc: [self, googleAnalyticsDomain],
              objectSrc: [self],
              scriptSrc,
              styleSrc: [self],
              manifestSrc: [self],
              formAction: [self],
            },
          },
          referrerPolicy: { policy: 'origin' },
        })
      );
    }
  }
}
