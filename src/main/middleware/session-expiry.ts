import type { RequestHandler } from 'express';

import { RouteNames } from '../constants';
import { RECENT_SESSION_COOKIE } from '../modules/session-timeout/recent-session-cookie';

/**
 * Redirects protected requests without an authenticated FCUI session.
 * Runs before CSRF validation so stale forms can reach the sign-in flow.
 */
export const sessionExpiryMiddleware: RequestHandler = (req, res, next): void => {
  if (req.session?.user) {
    return next();
  }

  res.set('Cache-Control', 'no-store');

  const cookies = req.cookies as Record<string, unknown> | undefined;
  const hadRecentSession = cookies?.[RECENT_SESSION_COOKIE] === '1';
  const redirectUrl = hadRecentSession ? RouteNames.timedOut : RouteNames.login;
  const isBackgroundRequest = req.xhr || req.get('Sec-Fetch-Dest') === 'empty';

  if (isBackgroundRequest) {
    res.status(401).json({ redirectUrl });
    return;
  }

  res.redirect(hadRecentSession ? 303 : 302, redirectUrl);
};
