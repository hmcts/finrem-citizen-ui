import config from 'config';
import { Application, Request, Response } from 'express';

import { RouteNames } from '../common-constants';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('logout');

export default function setupLogoutRoute(app: Application): void {
  app.get(RouteNames.logout, (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session:', err);
      }
      
      const cookieName = config.get<string>('session.cookieName');
      const secure = process.env.NODE_ENV === 'production';
      // Clear the session cookie
      res.clearCookie(cookieName, {
        path: RouteNames.basePath,
        httpOnly: true,
        secure: true,
        sameSite: secure ? 'none' : 'lax',
      });
      res.redirect(RouteNames.basePath);
    });
  });
}
