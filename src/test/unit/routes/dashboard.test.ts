import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Application, NextFunction, Request, Response } from 'express';

import { CaseRole } from '../../../main/app/case/definition';
import { RouteNames, ViewNames } from '../../../main/common-constants';
import setupDashboardRoute from '../../../main/routes/generalUpload/dashboard';


jest.mock('../../../main/functions/util/homePageUtil', () => ({
  setCaseUserRole: jest.fn().mockImplementation(async () => {}),
  setCaseUserName: jest.fn().mockImplementation(() => {}),
}));

jest.mock('../../../main/middleware', () => ({
  oidcMiddleware: jest.fn(
    (_req: Request, _res: Response, next: NextFunction) => next()
  ),
}));

describe('Dashboard Route', () => {
  let mockGet: jest.Mock;
  let handler: (req: Request, res: Response) => Promise<void>;

  async function callHandler(session: Record<string, unknown> = {}) {
    const req = { session } as unknown as Request;
    const res = { render: jest.fn() } as unknown as Response;

    await handler(req, res);
    return res;
  }

  beforeEach(() => {
    jest.clearAllMocks();

    mockGet = jest.fn();
    setupDashboardRoute({ get: mockGet } as unknown as Application);

    handler = mockGet.mock.calls[0][2] as typeof handler;
  });

  it('should register dashboard route with oidc middleware', () => {
    expect(mockGet).toHaveBeenCalledWith(
      RouteNames.dashboard,
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should render dashboard view with applicant name from caseData', async () => {
    const res = await callHandler({
      caseNumber: '1234-5678-9012-3456',
      user: { hasNFDCase: true },
      caseRole: CaseRole.APPLICANT,
      caseUserName: 'John Smith',
      caseData: {
        applicantFlags: { partyName: 'John Smith' },
        consentOrderFRCEmail: 'court@example.com',
      },
    });

    expect(res.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        userName: 'John Smith',
        caseNumber: '1234-5678-9012-3456',
        hasDivorceCase: true,
        showPreviouslyUploaded: true,
      })
    );
  });

  it('should render dashboard view with respondent name from caseData', async () => {
    const res = await callHandler({
      caseNumber: '1234-5678-9012-3456',
      user: { hasNFDCase: false },
      caseRole: CaseRole.RESPONDENT,
      caseUserName: 'Jane Doe',
      caseData: {
        respondentFlags: { partyName: 'Jane Doe' },
      },
    });

    expect(res.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        userName: 'Jane Doe',
        caseNumber: '1234-5678-9012-3456',
        hasDivorceCase: false,
        showPreviouslyUploaded: true,
      })
    );
  });

  it('should pass undefined when session data is missing', async () => {
    const res = await callHandler();

    expect(res.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        userName: undefined,
        caseNumber: undefined,
        hasDivorceCase: false,
        showPreviouslyUploaded: true,
      })
    );
  });

  it('should use role fallback when partyName is missing', async () => {
    const res = await callHandler({
      caseNumber: '1234-5678-9012-3456',
      caseRole: CaseRole.APPLICANT,
      caseUserName: 'Applicant',
      caseData: {
        applicantFlags: {},
      },
    });

    expect(res.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        userName: 'Applicant',
        showPreviouslyUploaded: true,
      })
    );
  });

  it('should set hasDivorceCase to true when user has NFD case (shows blue divorce account box)', async () => {
    const res = await callHandler({
      caseNumber: '1234-5678-9012-3456',
      user: { hasNFDCase: true },
      caseRole: CaseRole.APPLICANT,
      caseUserName: 'John Smith',
      caseData: {
        applicantFlags: { partyName: 'John Smith' },
      },
    });

    expect(res.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        hasDivorceCase: true,
        showPreviouslyUploaded: true,
      })
    );
  });

  it('should set hasDivorceCase to false when user does not have NFD case (hides blue divorce account box)', async () => {
    const res = await callHandler({
      caseNumber: '1234-5678-9012-3456',
      user: { hasNFDCase: false },
      caseRole: CaseRole.RESPONDENT,
      caseUserName: 'Jane Doe',
      caseData: {
        respondentFlags: { partyName: 'Jane Doe' },
      },
    });

    expect(res.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        hasDivorceCase: false,
        showPreviouslyUploaded: true,
      })
    );
  });

  it('should default hasDivorceCase to false when user object is missing', async () => {
    const res = await callHandler({
      caseNumber: '1234-5678-9012-3456',
      caseUserName: 'Test User',
    });

    expect(res.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        hasDivorceCase: false,
        showPreviouslyUploaded: true,
      })
    );
  });
});
