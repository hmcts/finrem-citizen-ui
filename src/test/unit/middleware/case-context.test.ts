import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

import { RouteNames } from '../../../main/constants';

var mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn(() => mockLogger),
  },
}));

jest.mock('../../../main/functions/util/homePageUtil', () => ({
  hydrateUserSessionWithCaseContext: jest.fn(),
}));

const { hydrateUserSessionWithCaseContext } = require('../../../main/functions/util/homePageUtil') as {
  hydrateUserSessionWithCaseContext: jest.MockedFunction<(session: unknown, logger: unknown) => Promise<unknown>>;
};
const { caseContextMiddleware } = require('../../../main/middleware/case-context') as {
  caseContextMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};

type ReqOverrides = {
  path?: string;
  originalUrl?: string;
  session?: {
    user?: { id?: string; sub?: string };
    caseNumber?: string;
    caseData?: unknown;
    caseContextHydratedUserId?: string;
    destroy?: (cb: () => void) => void;
  };
};

function makeReq(overrides: ReqOverrides = {}): Request {
  const req = {
    path: '/protected',
    originalUrl: '/protected',
    session: {
      user: { id: 'user-1', sub: 'sub-1' },
      destroy: jest.fn((cb: () => void) => cb()),
    },
    ...overrides,
  };

  return req as unknown as Request;
}

function makeRes(): Response {
  return {
    redirect: jest.fn(),
  } as unknown as Response;
}

describe('caseContextMiddleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
    hydrateUserSessionWithCaseContext.mockResolvedValue({});
  });

  it('hydrates on base path for authenticated users', async () => {
    const req = makeReq({ path: RouteNames.basePath, originalUrl: RouteNames.basePath });
    const res = makeRes();

    await caseContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(hydrateUserSessionWithCaseContext).toHaveBeenCalled();
  });

  it('hydrates on linking routes for authenticated users', async () => {
    const req = makeReq({ path: RouteNames.enterAccessCode, originalUrl: RouteNames.enterAccessCode });
    const res = makeRes();

    await caseContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(hydrateUserSessionWithCaseContext).toHaveBeenCalled();
  });

  it('skips hydration for unauthenticated requests', async () => {
    const req = makeReq({ session: undefined });
    const res = makeRes();

    await caseContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(hydrateUserSessionWithCaseContext).not.toHaveBeenCalled();
  });

  it('skips hydration when marker is already set for user', async () => {
    const req = makeReq({
      session: {
        user: { id: 'user-1' },
        caseContextHydratedUserId: 'user-1',
        destroy: (cb: () => void) => cb(),
      },
    });
    const res = makeRes();

    await caseContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(hydrateUserSessionWithCaseContext).not.toHaveBeenCalled();
  });

  it('skips hydration when case context already exists', async () => {
    const req = makeReq({
      session: {
        user: { id: 'user-1' },
        caseNumber: 'CASE123',
        destroy: (cb: () => void) => cb(),
      },
    });
    const res = makeRes();

    await caseContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(hydrateUserSessionWithCaseContext).not.toHaveBeenCalled();
  });

  it('hydrates and sets marker when needed', async () => {
    const req = makeReq({
      session: {
        user: { id: 'user-1' },
        destroy: (cb: () => void) => cb(),
      },
    });
    const res = makeRes();

    await caseContextMiddleware(req, res, next);

    expect(hydrateUserSessionWithCaseContext).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ info: expect.any(Function), error: expect.any(Function) })
    );
    expect(req.session?.caseContextHydratedUserId).toBe('user-1');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('destroys session and redirects to logout when hydration fails', async () => {
    const req = makeReq({
      session: {
        user: { id: 'user-1' },
        destroy: jest.fn((cb: () => void) => cb()),
      },
    });
    const res = makeRes();
    hydrateUserSessionWithCaseContext.mockRejectedValue(new Error('CCD down'));

    await caseContextMiddleware(req, res, next);

    expect(req.session?.destroy).toHaveBeenCalled();
    expect((res.redirect as jest.Mock)).toHaveBeenCalledWith(RouteNames.logout);
    expect(next).not.toHaveBeenCalled();
  });
});
