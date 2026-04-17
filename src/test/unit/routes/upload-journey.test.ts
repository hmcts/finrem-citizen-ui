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

    it('should render valid step with session data', () => {
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/before-you-start', {
        data: {},
        errors: {},
        values: {},
        previousStep: null,
      });

      mockReq.session = { uploadJourneyData: { acknowledgedConfidentiality: true } } as unknown as Request['session'];
      mockReq.params = { stepId: 'confidentiality' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/confidentiality', {
        data: { acknowledgedConfidentiality: true },
        errors: {},
        values: { acknowledgedConfidentiality: true },
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

    it('should handle validation and redirect', () => {
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload-journey/confidentiality');

      mockReq.params = { stepId: 'confidentiality' };
      mockReq.body = { acknowledgedConfidentiality: '' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/confidentiality', {
        data: {},
        errors: { acknowledgedConfidentiality: 'You must acknowledge the confidentiality statement' },
        values: { acknowledgedConfidentiality: '' },
        previousStep: 'before-you-start',
      });

      mockReq.body = { acknowledgedConfidentiality: 'true' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockReq.session?.uploadJourneyData).toEqual({ acknowledgedConfidentiality: true });
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
