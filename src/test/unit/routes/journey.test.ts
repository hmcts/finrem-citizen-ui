import { Application, Request, Response } from 'express';

import setupJourneyRoute from '../../../main/routes/journey';

describe('Journey Routes', () => {
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

  it('should register GET /journey/:stepId route', () => {
    setupJourneyRoute(app);
    expect(mockGet).toHaveBeenCalledWith('/journey/:stepId', expect.any(Function));
  });

  it('should register POST /journey/:stepId route', () => {
    setupJourneyRoute(app);
    expect(mockPost).toHaveBeenCalledWith('/journey/:stepId', expect.any(Function));
  });

  it('should register GET /journey route', () => {
    setupJourneyRoute(app);
    expect(mockGet).toHaveBeenCalledWith('/journey', expect.any(Function));
  });

  describe('GET /journey/:stepId', () => {
    let handler: (req: Request, res: Response) => void;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      setupJourneyRoute(app);
      handler = mockGet.mock.calls.find((call) => call[0] === '/journey/:stepId')[1];
      mockReq = {
        params: { stepId: 'step1' },
        session: {} as any,
      };
      mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it('should render step template for valid step', () => {
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.render).toHaveBeenCalledWith('journey/step1', {
        data: {},
        errors: {},
        values: {},
        previousStep: null,
      });
    });

    it('should return 404 for invalid step', () => {
      mockReq.params = { stepId: 'invalid-step' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith('Step not found');
    });

    it('should use session data if available', () => {
      mockReq.session = { journeyData: { step3Answer: 'yes' } } as any;
      mockReq.params = { stepId: 'step2' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.render).toHaveBeenCalledWith('journey/step2', {
        data: { step3Answer: 'yes' },
        errors: {},
        values: { step3Answer: 'yes' },
        previousStep: 'step1',
      });
    });
  });

  describe('POST /journey/:stepId', () => {
    let handler: (req: Request, res: Response) => void;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      setupJourneyRoute(app);
      handler = mockPost.mock.calls.find((call) => call[0] === '/journey/:stepId')[1];
      mockReq = {
        params: { stepId: 'step1' },
        session: {} as any,
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
      expect(mockRes.send).toHaveBeenCalledWith('Step not found');
    });

    it('should redirect to next step for valid submission', () => {
      mockReq.params = { stepId: 'step1' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/journey/step2');
    });

    it('should render errors for invalid submission', () => {
      mockReq.params = { stepId: 'step3-question' };
      mockReq.body = { step3Answer: '' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.render).toHaveBeenCalledWith('journey/step3-question', {
        data: {},
        errors: { step3Answer: 'Select yes or no' },
        values: { step3Answer: '' },
        previousStep: 'step2',
      });
    });

    it('should persist data and redirect for valid question submission', () => {
      mockReq.params = { stepId: 'step3-question' };
      mockReq.body = { step3Answer: 'yes' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockReq.session?.journeyData).toEqual({ step3Answer: 'yes' });
      expect(mockRes.redirect).toHaveBeenCalledWith('/journey/step4');
    });

    it('should redirect based on answer', () => {
      mockReq.params = { stepId: 'step3-question' };
      mockReq.body = { step3Answer: 'no' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/journey/step2');
    });

    it('should redirect to same step if no next step defined', () => {
      mockReq.params = { stepId: 'step8-complete' };
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/journey/step8-complete');
    });
  });

  describe('GET /journey', () => {
    let handler: (req: Request, res: Response) => void;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      setupJourneyRoute(app);
      handler = mockGet.mock.calls.find((call) => call[0] === '/journey')[1];
      mockReq = {};
      mockRes = {
        redirect: jest.fn(),
      };
    });

    it('should redirect to step1', () => {
      handler(mockReq as Request, mockRes as Response);
      expect(mockRes.redirect).toHaveBeenCalledWith('/journey/step1');
    });
  });
});
