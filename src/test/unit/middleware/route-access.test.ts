import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

import { CaseRole } from '../../../main/app/case/definition';
import { RouteNames } from '../../../main/constants';
import { routeAccessMiddleware } from '../../../main/middleware/route-access';

type SessionLike = {
  user?: {
    caseRole?: CaseRole;
  };
  caseRole?: CaseRole;
  caseNumber?: string;
};

function makeReq(path: string, session: SessionLike): Request {
  return {
    path,
    originalUrl: path,
    session,
  } as unknown as Request;
}

function makeRes(): Response {
  return {
    redirect: jest.fn(),
  } as unknown as Response;
}

describe('routeAccessMiddleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
  });

  it('allows request through for unauthenticated users', () => {
    const req = {
      path: RouteNames.dashboard,
      originalUrl: RouteNames.dashboard,
      session: undefined,
    } as unknown as Request;
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('redirects linked users away from enter-case-number', () => {
    const req = makeReq(RouteNames.enterCaseNumber, {
      user: { caseRole: CaseRole.APPLICANT },
      caseNumber: '1234567890123456',
    });
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(RouteNames.dashboard);
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects linked users away from enter-access-code', () => {
    const req = makeReq(RouteNames.enterAccessCode, {
      user: { caseRole: CaseRole.RESPONDENT },
      caseNumber: '1234567890123456',
    });
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(RouteNames.dashboard);
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects unlinked users to enter-case-number for linked-only exact routes', () => {
    const req = makeReq(RouteNames.dashboard, {
      user: {},
    });
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(RouteNames.enterCaseNumber);
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects users with case number but no role to enter-case-number for linked-only routes', () => {
    const req = makeReq(RouteNames.taskListUpload, {
      user: {},
      caseNumber: '1234567890123456',
    });
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(RouteNames.enterCaseNumber);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows unlinked users on public routes', () => {
    const req = makeReq(RouteNames.info, {
      user: {},
    });
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('redirects unlinked users to enter-case-number for linked-only prefix routes', () => {
    const req = makeReq(`${RouteNames.uploadJourney}/before-you-start`, {
      user: {},
    });
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(RouteNames.enterCaseNumber);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows linked users to access linked-only routes', () => {
    const req = makeReq(`${RouteNames.documents}/abc123/download`, {
      user: { caseRole: CaseRole.APPLICANT },
      caseNumber: '1234567890123456',
    });
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('allows unlinked users on non-protected routes', () => {
    const req = makeReq(RouteNames.basePath, {
      user: {},
    });
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
