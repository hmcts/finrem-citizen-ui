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
    setupUploadJourneyRoute(app);
  });

  it('should register all routes', () => {
    expect(mockGet).toHaveBeenCalledWith('/upload/:stepId', expect.any(Function));
    expect(mockPost).toHaveBeenCalledWith('/upload/:stepId', expect.any(Function));
    expect(mockGet).toHaveBeenCalledWith('/upload', expect.any(Function));
  });

  describe('GET /upload/:stepId', () => {
    it('should render valid step', () => {
      const handler = mockGet.mock.calls.find((call) => call[0] === '/upload/:stepId')[1];
      const mockReq = {
        params: { stepId: 'before-you-start' },
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
      });
    });

    it('should return 404 for invalid step', () => {
      const handler = mockGet.mock.calls.find((call) => call[0] === '/upload/:stepId')[1];
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
      const handler = mockPost.mock.calls.find((call) => call[0] === '/upload/:stepId')[1];
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
      const handler = mockPost.mock.calls.find((call) => call[0] === '/upload/:stepId')[1];
      const mockReq = {
        params: { stepId: 'before-you-start' },
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
      
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/confidentiality');
    });

    it('should handle validation errors', () => {
      const { uploadSteps } = require('../../../main/upload-journey/config');
      uploadSteps['confidentiality'].validate = () => ({ error: 'Test error' });

      const handler = mockPost.mock.calls.find((call) => call[0] === '/upload/:stepId')[1];
      const mockReq = {
        params: { stepId: 'confidentiality' },
        session: {} as unknown as Request['session'],
        body: {},
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.render).toHaveBeenCalled();
      
      delete uploadSteps['confidentiality'].validate;
    });

    it('should persist data', () => {
      const { uploadSteps } = require('../../../main/upload-journey/config');
      uploadSteps['confidentiality'].persist = (body: Record<string, unknown>) => ({ data: body.test });

      const handler = mockPost.mock.calls.find((call) => call[0] === '/upload/:stepId')[1];
      const mockReq = {
        params: { stepId: 'confidentiality' },
        session: {} as unknown as Request['session'],
        body: { test: 'value' },
      } as Partial<Request>;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);
      
      expect(mockReq.session?.uploadJourneyData).toEqual({ data: 'value' });
      
      delete uploadSteps['confidentiality'].persist;
    });

    it('should handle missing session', () => {
      const handler = mockPost.mock.calls.find((call) => call[0] === '/upload/:stepId')[1];
      const mockReq = {
        params: { stepId: 'before-you-start' },
        session: undefined,
        body: {},
      } as Partial<Request>;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.redirect).toHaveBeenCalled();
    });
  });

  describe('GET /upload', () => {
    it('should redirect to first step', () => {
      setupUploadJourneyRoute(app);
      const handler = mockGet.mock.calls.find((call) => call[0] === '/upload')[1];
      const mockRes = { redirect: jest.fn() } as Partial<Response>;
      handler({} as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/before-you-start');
    });
  });
});
