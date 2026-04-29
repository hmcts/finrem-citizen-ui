import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../../../main/common-constants';
import setupDashboardRoute from '../../../main/routes/dashboard';

describe('Dashboard Route', () => {
  let app: Application;
  let mockGet: jest.Mock;

  beforeEach(() => {
    mockGet = jest.fn();
    app = {
      get: mockGet,
    } as unknown as Application;
    setupDashboardRoute(app);
  });

  it('should register dashboard route with oidc middleware', () => {
    expect(mockGet).toHaveBeenCalledWith(RouteNames.dashboard, expect.any(Function), expect.any(Function));
  });

  it('should render dashboard view with user data', () => {
    const mockReq = {} as Request;
    const mockRes = {
      render: jest.fn(),
    } as unknown as Response;

    const handler = mockGet.mock.calls[0][2] as (req: Request, res: Response) => void;
    handler(mockReq, mockRes);

    expect(mockRes.render).toHaveBeenCalledWith(
      ViewNames.Dashboard,
      expect.objectContaining({
        userName: expect.any(String),
        caseNumber: expect.any(String),
        hasDivorceCase: expect.any(Boolean),
      })
    );
  });
});
