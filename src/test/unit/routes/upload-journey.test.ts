import { Application, Request, Response } from 'express';

import setupUploadJourneyRoute from '../../../main/routes/upload-journey';

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
  });

  it('should register all routes', () => {
    setupUploadJourneyRoute(app);
    expect(mockGet).toHaveBeenCalledWith('/upload-journey/:stepId', expect.any(Function));
    expect(mockPost).toHaveBeenCalledWith('/upload-journey/:stepId', expect.any(Function));
    expect(mockGet).toHaveBeenCalledWith('/upload-journey', expect.any(Function));
  });

  describe('GET /upload-journey/:stepId', () => {
    let handler: (req: Request, res: Response) => void;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      setupUploadJourneyRoute(app);
      handler = mockGet.mock.calls.find((call) => call[0] === '/upload-journey/:stepId')[1];
      mockReq = {
        params: { stepId: 'before-you-start' },
        session: {} as unknown as Request['session'],
      };
      mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it('should render valid step', () => {
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/before-you-start', {
        data: {},
        errors: {},
        values: {},
        previousStep: null,
      });

      mockReq.params = { stepId: 'confidentiality' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/confidentiality', {
        data: {},
        errors: {},
        values: {},
        previousStep: 'before-you-start',
      });
    });

    it('should return 404 for invalid step', () => {
      mockReq.params = { stepId: 'invalid-step' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith('Step not found');
    });
  });

  describe('POST /upload-journey/:stepId', () => {
    let handler: (req: Request, res: Response) => void;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      setupUploadJourneyRoute(app);
      handler = mockPost.mock.calls.find((call) => call[0] === '/upload-journey/:stepId')[1];
      mockReq = {
        params: { stepId: 'before-you-start' },
        session: {} as unknown as Request['session'],
        body: {},
      };
      mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it('should return 404 for invalid step', () => {
      mockReq.params = { stepId: 'invalid-step' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should redirect to next step', () => {
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload-journey/confidentiality');

      mockReq.params = { stepId: 'confidentiality' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload-journey/confidentiality');
    });

    it('should render errors when validation fails', () => {
      // Temporarily mock a step with validation to test error path
      const { uploadSteps } = require('../../../main/upload-journey/config');
      const originalValidate = uploadSteps.confidentiality.validate;
      uploadSteps.confidentiality.validate = (body: Record<string, unknown>) => {
        return body.testField ? {} : { testField: 'Test error' };
      };

      mockReq.params = { stepId: 'confidentiality' };
      mockReq.body = {};
      handler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/confidentiality', {
        data: {},
        errors: { testField: 'Test error' },
        values: {},
        previousStep: 'before-you-start',
      });

      // Restore original
      uploadSteps.confidentiality.validate = originalValidate;
    });

    it('should persist data when step has persist function', () => {
      // Temporarily mock a step with persist to test persist path
      const { uploadSteps } = require('../../../main/upload-journey/config');
      const originalPersist = uploadSteps.confidentiality.persist;
      uploadSteps.confidentiality.persist = (body: Record<string, unknown>, data: Record<string, unknown>) => ({
        ...data,
        testData: body.testField,
      });

      mockReq.params = { stepId: 'confidentiality' };
      mockReq.body = { testField: 'test-value' };
      handler(mockReq as Request, mockRes as Response);
      
      expect(mockReq.session?.uploadJourneyData).toEqual({ testData: 'test-value' });

      // Restore original
      uploadSteps.confidentiality.persist = originalPersist;
    });

    it('should handle missing session', () => {
      mockReq.session = undefined;
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload-journey/confidentiality');
    });
  });

  describe('GET /upload-journey', () => {
    it('should redirect to first step', () => {
      setupUploadJourneyRoute(app);
      const handler = mockGet.mock.calls.find((call) => call[0] === '/upload-journey')[1];
      const mockRes = { redirect: jest.fn() } as Partial<Response>;
      handler({} as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload-journey/before-you-start');
    });
  });
});
