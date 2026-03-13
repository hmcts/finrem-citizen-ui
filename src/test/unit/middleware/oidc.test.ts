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
    const req = makeReq({
      session: { user: { accessToken: 'token', idToken: 'id', sub: 'u1', refreshToken: undefined } } as never,
    });
    const res = makeRes();

    oidcMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('calls next for /login without requiring a session', () => {
    const req = makeReq({ session: undefined, path: '/login', originalUrl: '/login' });
    const res = makeRes();

    oidcMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('stores returnTo and redirects to /login when session exists but no user', () => {
    const req = {
      path: '/protected',
      originalUrl: '/protected?query=1',
      session: {
        user: undefined,
        save: jest.fn(callback => callback()),
      },
    } as unknown as Request;

    const res = {
      redirect: jest.fn(),
    } as unknown as Response;

    next = jest.fn() as NextFunction;

    oidcMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(req.session!.returnTo).toBe('/protected?query=1');
    expect(req.session!.save).toHaveBeenCalled(); // Verify save was called
    expect(res.redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login without setting returnTo when session is falsy', () => {
    const req = makeReq({ session: null as never, originalUrl: '/my-page' });
    const res = makeRes();

    oidcMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });
});
