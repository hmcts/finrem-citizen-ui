import { describe, expect, it, jest } from '@jest/globals';
import type { Request, Response } from 'express';

import { RouteNames } from '../../../main/constants';
import { sessionExpiryMiddleware } from '../../../main/middleware/session-expiry';
import type {} from '../../../main/types/express-session';

function run(
  session: unknown = {},
  destination = 'document',
  xhr = false
) {
  const req = {
    session,
    xhr,
    get: () => destination,
  } as unknown as Request;

  const res = {
    set: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    redirect: jest.fn(),
  } as unknown as Response;

  const next = jest.fn();

  sessionExpiryMiddleware(req, res, next);

  return { res, next };
}

describe('Session expiry middleware', () => {
  it('allows authenticated requests', () => {
    const { res, next } = run({ user: { id: 'user-1' } });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated page requests to the timed-out page', () => {
    const { res, next } = run();

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.redirect).toHaveBeenCalledWith(303, RouteNames.timedOut);
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'fetch', destination: 'empty', xhr: false },
    { name: 'XHR', destination: '', xhr: true },
  ])('returns 401 for unauthenticated $name requests', ({
                                                          destination,
                                                          xhr,
                                                        }) => {
    const { res, next } = run({}, destination, xhr);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      redirectUrl: RouteNames.timedOut,
    });
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
