import { Application, Request, Response } from 'express';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('logout');

export default function setupLogoutRoute(app: Application): void {
  app.get('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session:', err);
      }
      res.redirect('/');
    });
  });
}
