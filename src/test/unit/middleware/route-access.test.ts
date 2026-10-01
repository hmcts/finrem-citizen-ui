import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

import { CaseRole } from '../../../main/app/case/definition';
import { RouteNames } from '../../../main/constants';
import { routeAccessMiddleware } from '../../../main/middleware/route-access';

function makeReq(
  path: string,
  session: {
    user?: { caseRole?: CaseRole };
    caseRole?: CaseRole;
    caseNumber?: string;
  }
): Request {
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
      path: RouteNames.login,
      originalUrl: RouteNames.login,
      session: undefined,
    } as unknown as Request;
    const res = makeRes();

    routeAccessMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  describe('when user is linked to a case', () => {
    it('redirects away from enter-case-number', () => {
      const req = makeReq(RouteNames.enterCaseNumber, {
        user: { caseRole: CaseRole.APPLICANT },
        caseNumber: '1234567890123456',
      });
      const res = makeRes();

      routeAccessMiddleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(RouteNames.dashboard);
      expect(next).not.toHaveBeenCalled();
    });

    it('redirects away from enter-access-code', () => {
      const req = makeReq(RouteNames.enterAccessCode, {
        user: { caseRole: CaseRole.RESPONDENT },
        caseNumber: '1234567890123456',
      });
      const res = makeRes();

      routeAccessMiddleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(RouteNames.dashboard);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows access to case linked routes', () => {
      const req = makeReq(`${RouteNames.documents}/abc123/download`, {
        user: { caseRole: CaseRole.APPLICANT },
        caseNumber: '1234567890123456',
      });
      const res = makeRes();

      routeAccessMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });

  describe('when user is not linked to a case', () => {
    it('redirects to enter-case-number if route requires linked case', () => {
      const req = makeReq(RouteNames.dashboard, {
        user: {},
      });
      const res = makeRes();

      routeAccessMiddleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(RouteNames.enterCaseNumber);
      expect(next).not.toHaveBeenCalled();
    });

    it('redirects to enter-case-number for document upload prefixed routes', () => {
      const req = makeReq(`${RouteNames.uploadJourney}/before-you-start`, {
        user: {},
      });
      const res = makeRes();

      routeAccessMiddleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(RouteNames.enterCaseNumber);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows access to public routes', () => {
      const req = makeReq(RouteNames.basePath, {
        user: {},
      });
      const res = makeRes();

      routeAccessMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });
});
