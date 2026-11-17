import { describe, expect, it, jest } from '@jest/globals';
import type { Express, Request, RequestHandler, Response } from 'express';

import { RouteNames, ViewNames } from '../../../../main/constants';
import { SessionTimeout } from '../../../../main/modules/session-timeout';
import { RECENT_SESSION_COOKIE } from '../../../../main/modules/session-timeout/recent-session-cookie';

// Use a predictable session cookie name instead of loading real configuration.
jest.mock('config', () => ({
  get: () => 'test-session',
}));

// Prepare the mocks and invoke the timed-out route.
// Passing an error simulates the session store failing to destroy the session.
function invokeTimedOutHandler(error?: Error) {
  // Capture the handler registered through app.get().
  const get = jest.fn<(path: string, handler: RequestHandler) => void>();

  new SessionTimeout().enableFor({ get } as unknown as Express);

  const handler = get.mock.calls.find(([path]) => path === RouteNames.timedOut)?.[1];

  if (!handler) {
    throw new Error('Timed-out route was not registered');
  }

  // Simulate session destruction completing successfully or with an error.
  const destroy = jest.fn((callback: (error?: Error) => void) => {
    callback(error);
  });

  // Only provide the request properties used by this handler.
  const req = {
    session: { destroy },
  } as unknown as Request;

  // Record response calls without sending a real HTTP response.
  const res = {
    set: jest.fn(),
    clearCookie: jest.fn(),
    render: jest.fn(),
  };

  // Record errors forwarded to Express's error-handling middleware.
  const next = jest.fn();

  handler(req, res as unknown as Response, next);

  // Return the mocks so each test can check the handler's behaviour.
  return { destroy, res, next };
}

describe('Session timeout page', () => {
  it('destroys the session, clears both cookies and renders the page', () => {
    const { destroy, res, next } = invokeTimedOutHandler();

    // Prevent caching and remove the session and its browser cookie.
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith('test-session', {
      path: '/',
    });
    expect(res.clearCookie).toHaveBeenCalledWith(RECENT_SESSION_COOKIE, expect.objectContaining({ path: '/' }));

    // Display the timed-out page with a link to sign back in.
    expect(res.render).toHaveBeenCalledWith(ViewNames.TimedOut, {
      loginUrl: RouteNames.login,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards session destruction errors without rendering the page', () => {
    const error = new Error('Session destruction failed');
    const { res, next } = invokeTimedOutHandler(error);

    // Forward the failure without claiming the user was successfully signed out.
    expect(next).toHaveBeenCalledWith(error);
    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(res.render).not.toHaveBeenCalled();
  });
});
