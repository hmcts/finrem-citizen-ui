import config from 'config';
import type { Express } from 'express';

import { RouteNames, ViewNames } from '../../constants';

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
      // Tell browsers and proxies not to store this response.
      res.set('Cache-Control', 'no-store');

      // Wait for session deletion to complete before showing the page.
      req.session.destroy(error => {
        if (error) {
          // Forward session-store failures to the global error handler.
          return next(error);
        }

        // Remove the browser's session cookie using its original path.
        res.clearCookie(config.get<string>('session.cookieName'), {
          path: '/',
        });

        res.render(ViewNames.TimedOut, {
          loginUrl: RouteNames.login,
        });
      });
    });
  }
}
