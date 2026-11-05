import type { RequestHandler } from 'express';

import { RouteNames } from '../constants';

/**
 * Handles protected requests without an authenticated FCUI session.
 *
 * Register before CSRF validation so expired form submissions reach
 * the timed-out page instead of failing with a CSRF error.
 */
export const sessionExpiryMiddleware: RequestHandler = (req, res, next): void => {
  if (req.session?.user) {
    return next();
  }

  res.set('Cache-Control', 'no-store');

  // Detect XMLHttpRequest and fetch requests made in the background.
  const isBackgroundRequest =
    req.xhr || req.get('Sec-Fetch-Dest') === 'empty';

  if (isBackgroundRequest) {
    // Frontend code must handle this response and navigate to redirectUrl.
    res.status(401).json({
      redirectUrl: RouteNames.timedOut,
    });
    return;
  }

  // Use 303 so the browser follows with GET, including after a POST.
  res.redirect(303, RouteNames.timedOut);
};
