import config from 'config';
import type { Express } from 'express';

import { RouteNames, ViewNames } from '../../constants';
import { clearRecentSessionCookie } from './recent-session-cookie';

/**
 * Handles the timed-out page, clearing the FCUI session before
 * displaying a link to sign in again.
 */
export class SessionTimeout {
  /**
   * Registers GET /timed-out.
   *
   * Register after session middleware and before case-context loading
   * so users can reach this page without an active or fully loaded case.
   *
   * @param app Express application receiving the route.
   */
  public enableFor(app: Express): void {
    app.get(RouteNames.timedOut, (req, res, next) => {
      res.set('Cache-Control', 'no-store');

      req.session.destroy(error => {
        if (error) {
          return next(error);
        }

        res.clearCookie(config.get<string>('session.cookieName'), {
          path: '/',
        });

        clearRecentSessionCookie(res);

        res.render(ViewNames.TimedOut, {
          loginUrl: RouteNames.login,
        });
      });
    });
  }
}
