import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Application, NextFunction, Request, Response } from 'express';

import { RouteNames } from '../../../../main/common-constants';

type CsrfSyncOptions = {
  ignoredMethods: string[];
  getTokenFromRequest: (req: Request) => string | undefined;
  getTokenFromState: (req: Request) => string | undefined;
  storeTokenInState: (req: Request, token: string) => void;
};

type ExpressHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

type ExpressErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => void;

const mockCsrfSynchronisedProtection = jest.fn(
  (_req: Request, _res: Response, next: NextFunction): void => next()
);

let capturedOptions: CsrfSyncOptions | undefined;

const csrfSyncMock = jest.fn((options: CsrfSyncOptions) => {
  capturedOptions = options;

  return {
    csrfSynchronisedProtection: mockCsrfSynchronisedProtection,
  };
});

jest.mock('csrf-sync', () => ({
  csrfSync: (options: CsrfSyncOptions) => csrfSyncMock(options),
}));

const { CSRFToken } = require('../../../../main/modules/csrf') as typeof import('../../../../main/modules/csrf');

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    headers: {},
    query: {},
    session: {},
    ...overrides,
  } as unknown as Request;
}

describe('CSRFToken module', () => {
  let app: Application;
  let use: jest.Mock;
  let options: CsrfSyncOptions;

  const getTokenMiddleware = (): ExpressHandler =>
    use.mock.calls[1][0] as ExpressHandler;

  const getErrorMiddleware = (): ExpressErrorHandler =>
    use.mock.calls[2][0] as ExpressErrorHandler;

  beforeEach(() => {
    mockCsrfSynchronisedProtection.mockClear();

    use = jest.fn();
    app = { use } as unknown as Application;

    new CSRFToken().enableFor(app);

    if (!capturedOptions) {
      throw new Error('Expected csrf-sync options to be captured');
    }

    options = capturedOptions;
  });

  it('configures csrf-sync with expected ignored methods', () => {
    expect(options.ignoredMethods).toEqual(['GET', 'HEAD', 'OPTIONS']);
  });

  it.each([
    ['request-body', makeReq({ body: { _csrf: 'request-body' } })],
    ['request-header', makeReq({ headers: { 'x-csrf-token': 'request-header' } })],
    ['query-string', makeReq({ query: { _csrf: ['query-string', 'second-token'] } })],
  ])('reads CSRF token from %s', (source, req) => {
    expect(options.getTokenFromRequest(req)).toBe(source);
  });

  it('stores and retrieves CSRF token in session state', () => {
    const req = makeReq({ session: {} as Request['session'] });

    options.storeTokenInState(req, 'stored-token');

    expect(options.getTokenFromState(req)).toBe('stored-token');
  });

  it('registers CSRF middleware and populates res.locals.csrfToken', () => {
    expect(use).toHaveBeenNthCalledWith(1, mockCsrfSynchronisedProtection);

    const middleware = getTokenMiddleware();

    const req = makeReq({
      csrfToken: jest.fn(() => 'generated-token') as Request['csrfToken'],
    });

    const res = { locals: {} } as Response;

    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.locals.csrfToken).toBe('generated-token');
    expect(next).toHaveBeenCalled();
  });

  it('redirects token validation errors to CSRF error route', () => {
    const middleware = getErrorMiddleware();

    const res = {
      redirect: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    middleware(
      { code: 'EBADCSRFTOKEN', stack: 'token validation failed' },
      makeReq(),
      res,
      next
    );

    expect(res.redirect).toHaveBeenCalledWith(RouteNames.csrfError);
    expect(next).not.toHaveBeenCalled();
  });

  it('delegates non-CSRF errors to next middleware', () => {
    const middleware = getErrorMiddleware();

    const res = { redirect: jest.fn() } as unknown as Response;

    const next = jest.fn() as NextFunction;

    middleware(new Error('some other error'), makeReq(), res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
