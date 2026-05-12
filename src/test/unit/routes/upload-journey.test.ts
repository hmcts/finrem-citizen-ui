import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Application, Request, Response } from 'express';

import { RouteNames, UploadStepNames } from '../../../main/common-constants';
import setupUploadJourneyRoute from '../../../main/routes/upload-journey';

type UploadJourneyHandler = (req: Request, res: Response) => void;

function getRegisteredHandler(mockFn: jest.Mock, route: string): UploadJourneyHandler {
  const call = mockFn.mock.calls.find((entry: unknown[]) => entry[0] === route);

  if (!call) {
    throw new Error(`Expected route handler for ${route} to be registered`);
  }

  return call[2] as UploadJourneyHandler;
}

describe('Upload Journey Routes', () => {
  let app: Application;
  let mockGet: jest.Mock;
  let mockPost: jest.Mock;

  beforeEach(() => {
    mockGet = jest.fn();
    mockPost = jest.fn();
    app = {
      get: mockGet,
      post: mockPost,
    } as unknown as Application;
    setupUploadJourneyRoute(app);
  });

  it('should register all routes', () => {
    expect(mockGet).toHaveBeenCalledWith(
      `${RouteNames.uploadJourney}/:stepId`,
      expect.any(Function),
      expect.any(Function)
    );
    expect(mockPost).toHaveBeenCalledWith(
      `${RouteNames.uploadJourney}/:stepId`,
      expect.any(Function),
      expect.any(Function)
    );
    expect(mockGet).toHaveBeenCalledWith(RouteNames.uploadJourney, expect.any(Function), expect.any(Function));
  });

  describe('GET /upload/:stepId', () => {
    it('should render valid step', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.BeforeYouStart },
        session: {} as unknown as Request['session'],
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/before-you-start', {
        data: {},
        errors: {},
        values: {},
        previousStep: null,
        cancelUrl: RouteNames.dashboard,
        email: 'FRCexample@justice.gov.uk',
      });
    });

    it('should render FDR step with session data', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {
          uploadJourneyData: { fdrHearing: 'yes' },
        } as unknown as Request['session'],
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/fdr', {
        data: { fdrHearing: 'yes' },
        errors: {},
        values: { fdrHearing: 'yes' },
        previousStep: UploadStepNames.Confidentiality,
        cancelUrl: RouteNames.dashboard,
        email: 'FRCexample@justice.gov.uk',
      });
    });

    it('should return 404 for invalid step', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'invalid-step' },
        session: {} as unknown as Request['session'],
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith('Step not found');
    });
  });

  describe('POST /upload/:stepId', () => {
    it('should return 404 for invalid step', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'invalid-step' },
        session: {} as unknown as Request['session'],
        body: {},
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should redirect to next step', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.BeforeYouStart },
        session: {} as unknown as Request['session'],
        body: {},
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/confidentiality`);
    });

    it('should handle validation errors', () => {
      const { uploadSteps } = require('../../../main/upload-journey/config');
      uploadSteps[UploadStepNames.Confidentiality].validate = () => ({ error: 'Test error' });

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.Confidentiality },
        session: {} as unknown as Request['session'],
        body: {},
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalled();

      delete uploadSteps[UploadStepNames.Confidentiality].validate;
    });

    it('should persist data', () => {
      const { uploadSteps } = require('../../../main/upload-journey/config');
      uploadSteps[UploadStepNames.Confidentiality].persist = (body: Record<string, unknown>) => ({ data: body.test });

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.Confidentiality },
        session: {} as unknown as Request['session'],
        body: { test: 'value' },
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.uploadJourneyData).toEqual({ data: 'value' });

      delete uploadSteps[UploadStepNames.Confidentiality].persist;
    });

    it('should handle missing session', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.BeforeYouStart },
        session: undefined,
        body: {},
      } as Partial<Request>;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalled();
    });

    it('should persist FDR hearing selection', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {} as unknown as Request['session'],
        body: { fdrHearing: 'yes' },
      } as Partial<Request>;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.uploadJourneyData).toEqual({ fdrHearing: 'yes' });
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-selection`);
    });

    it('should persist FDR hearing selection as no', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {} as unknown as Request['session'],
        body: { fdrHearing: 'no' },
      } as Partial<Request>;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.uploadJourneyData).toEqual({ fdrHearing: 'no' });
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-selection`);
    });
  });

  describe('GET /upload', () => {
    it('should redirect to first step', () => {
      setupUploadJourneyRoute(app);
      const handler = getRegisteredHandler(mockGet, RouteNames.uploadJourney);
      const mockRes = { redirect: jest.fn() } as Partial<Response>;
      handler({} as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/before-you-start`);
    });
  });
});
