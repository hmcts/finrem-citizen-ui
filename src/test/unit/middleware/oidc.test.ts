import type { NextFunction, Request, Response } from 'express';

import { oidcMiddleware } from '../../../main/middleware/oidc';

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    session: undefined,
    originalUrl: '/protected',
    ...overrides,
  } as unknown as Request;
}

function makeRes(): Response {
  const res = {
    redirect: jest.fn(),
  };
  return res as unknown as Response;
}

describe('oidcMiddleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next when user is in session', () => {
    const req = makeReq({ session: { user: { accessToken: 'token', idToken: 'id', sub: 'u1', refreshToken: undefined } } as never });
    const res = makeRes();

    oidcMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('stores returnTo and redirects to /login when session exists but no user', () => {
    const session = {} as never;
    const req = makeReq({ session, originalUrl: '/my-page' });
    const res = makeRes();

    oidcMiddleware(req, res, next);

    expect((session as Record<string, string>)['returnTo']).toBe('/my-page');
    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects to /login without setting returnTo when session is falsy', () => {
    const req = makeReq({ session: null as never, originalUrl: '/my-page' });
    const res = makeRes();

    oidcMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });
});
