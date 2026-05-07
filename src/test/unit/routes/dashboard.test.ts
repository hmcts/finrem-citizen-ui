import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Application, Request, Response } from 'express';

import { CaseRole } from '../../../main/app/case/definition';
import { RouteNames, ViewNames } from '../../../main/common-constants';
import setupDashboardRoute from '../../../main/routes/dashboard';

describe('Dashboard Route', () => {
  let mockGet: jest.Mock;
  let handler: (req: Request, res: Response) => void;

  // Creates mock req/res, calls the route handler, and returns res for assertions
  function callHandler(session: Record<string, unknown> = {}) {
    // Auto-populate caseUserName from caseData and caseRole if not already set
    if (!session.caseUserName && session.caseData && session.caseRole) {
      const caseData = session.caseData as { applicantFlags?: { partyName?: string }; respondentFlags?: { partyName?: string } };
      if (session.caseRole === CaseRole.APPLICANT) {
        session.caseUserName = caseData.applicantFlags?.partyName || 'Applicant';
      } else if (session.caseRole === CaseRole.RESPONDENT) {
        session.caseUserName = caseData.respondentFlags?.partyName || 'Respondent';
      }
    }
    
    const req = { session } as unknown as Request;
    const res = { render: jest.fn() } as unknown as Response;
    handler(req, res);
    return res;
  }

  beforeEach(() => {
    mockGet = jest.fn();
    setupDashboardRoute({ get: mockGet } as unknown as Application);
    handler = mockGet.mock.calls[0][2] as typeof handler;
  });

  it('should register dashboard route with oidc middleware', () => {
    expect(mockGet).toHaveBeenCalledWith(RouteNames.dashboard, expect.any(Function), expect.any(Function));
  });

  it('should render dashboard view with applicant name from caseData', () => {
    const res = callHandler({
      caseNumber: '1234-5678-9012-3456',
      user: { hasNFDCase: true },
      caseRole: CaseRole.APPLICANT,
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

  it('should render dashboard view with respondent name from caseData', () => {
    const res = callHandler({
      caseNumber: '1234-5678-9012-3456',
      user: { hasNFDCase: false },
      caseRole: CaseRole.RESPONDENT,
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

  it('should use fallback values when session data is missing', () => {
    const res = callHandler();

    expect(res.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        userName: 'Unknown User',
        caseNumber: '0000-0000-0000-0000',
        hasDivorceCase: false,
        showPreviouslyUploaded: true,
      })
    );
  });

  it('should use role fallback when partyName is missing', () => {
    const res = callHandler({
      caseNumber: '1234-5678-9012-3456',
      caseRole: CaseRole.APPLICANT,
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
});
