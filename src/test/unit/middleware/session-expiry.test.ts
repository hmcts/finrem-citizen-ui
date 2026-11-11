import { describe, expect, it, jest } from '@jest/globals';
import type { Request, Response } from 'express';

import { RouteNames } from '../../../main/constants';
import { sessionExpiryMiddleware } from '../../../main/middleware/session-expiry';
import { RECENT_SESSION_COOKIE } from '../../../main/modules/session-timeout/recent-session-cookie';

type RequestOptions = {
  session?: unknown;
  cookies?: Record<string, string>;
  destination?: string;
  xhr?: boolean;
};

const recentSessionCookies = { [RECENT_SESSION_COOKIE]: '1' };

function run({ session = {}, cookies = {}, destination = 'document', xhr = false }: RequestOptions = {}) {
  const req = {
    session,
    cookies,
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
    const { res, next } = run({ session: { user: { id: 'user-1' } } });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('redirects to login when there is no recent session cookie', () => {
    const { res, next } = run();

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.redirect).toHaveBeenCalledWith(302, RouteNames.login);
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects to the timed-out page when the recent session cookie remains', () => {
    const { res, next } = run({ cookies: recentSessionCookies });

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.redirect).toHaveBeenCalledWith(303, RouteNames.timedOut);
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'fetch', destination: 'empty', xhr: false },
    { name: 'XHR', destination: '', xhr: true },
  ])('returns 401 with the timed-out URL for expired $name requests', ({ destination, xhr }) => {
    const { res, next } = run({ cookies: recentSessionCookies, destination, xhr });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ redirectUrl: RouteNames.timedOut });
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with the login URL for a background request without a recent session', () => {
    const { res, next } = run({ destination: 'empty' });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ redirectUrl: RouteNames.login });
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
