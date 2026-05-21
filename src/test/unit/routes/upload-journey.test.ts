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
  let mockDelete: jest.Mock;

  beforeEach(() => {
    mockGet = jest.fn();
    mockPost = jest.fn();
    mockDelete = jest.fn();
    app = {
      get: mockGet,
      post: mockPost,
      delete: mockDelete,
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
    expect(mockPost).toHaveBeenCalledWith(
      `${RouteNames.uploadJourney}/document-selection/add`,
      expect.any(Function),
      expect.any(Function)
    );
    expect(mockDelete).toHaveBeenCalledWith(
      `${RouteNames.uploadJourney}/document-selection/remove/:index`,
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
        email: 'FRCexample@justice.gov.uk',
      });
    });

    it('should render FDR step with session data', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {
          fdrHearing: 'yes',
        } as unknown as Request['session'],
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/fdr', {
        data: {},
        errors: {},
        values: { fdrHearing: 'yes' },
        previousStep: UploadStepNames.Confidentiality,
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

    it('should redirect to next step from before-you-start', () => {
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

    it('should redirect to next step from FDR', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {} as unknown as Request['session'],
        body: { fdrHearing: 'yes' },
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-selection`);
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

    it('should store fdrHearing in session', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {} as unknown as Request['session'],
        body: { fdrHearing: 'yes' },
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.fdrHearing).toBe('yes');
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-selection`);
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

      expect(mockReq.session?.fdrHearing).toBe('yes');
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

      expect(mockReq.session?.fdrHearing).toBe('no');
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

  describe('POST /upload/document-selection/add', () => {
    it('should add document to session', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/document-selection/add`);
      const mockReq = {
        session: {} as unknown as Request['session'],
        body: { id: 1, label: 'Payslips', value: 'PAYSLIPS' },
      } as Partial<Request>;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.uploadJourneyData?.selectedDocuments).toEqual([
        { id: 1, label: 'Payslips', value: 'PAYSLIPS' },
      ]);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: [{ id: 1, label: 'Payslips', value: 'PAYSLIPS' }],
      });
    });

    it('should append to existing documents', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/document-selection/add`);
      const mockReq = {
        session: {
          uploadJourneyData: {
            selectedDocuments: [{ id: 1, label: 'Payslips', value: 'PAYSLIPS' }],
          },
        } as unknown as Request['session'],
        body: { id: 2, label: 'Bank statements', value: 'BANK_STATEMENTS' },
      } as Partial<Request>;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.uploadJourneyData?.selectedDocuments).toHaveLength(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: [
          { id: 1, label: 'Payslips', value: 'PAYSLIPS' },
          { id: 2, label: 'Bank statements', value: 'BANK_STATEMENTS' },
        ],
      });
    });
  });

  describe('DELETE /upload/document-selection/remove/:index', () => {
    it('should remove document from session', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-selection/remove/:index`);
      const mockReq = {
        params: { index: '0' },
        session: {
          uploadJourneyData: {
            selectedDocuments: [
              { id: 1, label: 'Payslips', value: 'PAYSLIPS' },
              { id: 2, label: 'Bank statements', value: 'BANK_STATEMENTS' },
            ],
          },
        } as unknown as Request['session'],
      } as Partial<Request>;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.uploadJourneyData?.selectedDocuments).toEqual([
        { id: 2, label: 'Bank statements', value: 'BANK_STATEMENTS' },
      ]);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: [{ id: 2, label: 'Bank statements', value: 'BANK_STATEMENTS' }],
      });
    });

    it('should handle invalid index', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-selection/remove/:index`);
      const mockReq = {
        params: { index: '99' },
        session: {
          uploadJourneyData: {
            selectedDocuments: [{ id: 1, label: 'Payslips', value: 'PAYSLIPS' }],
          },
        } as unknown as Request['session'],
      } as Partial<Request>;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.uploadJourneyData?.selectedDocuments).toEqual([
        { id: 1, label: 'Payslips', value: 'PAYSLIPS' },
      ]);
    });
  });
});
