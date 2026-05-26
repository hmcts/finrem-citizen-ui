import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Application, Request, Response } from 'express';

import { RouteNames, UploadStepNames } from '../../../main/common-constants';
import setupUploadJourneyRoute from '../../../main/routes/upload-journey';

type MockSession = {
  DocumentSelection?: {
    isFinancialDisputeResolution?: boolean;
    documentDetails?: { id?: string; value?: { DocumentType?: string } }[];
  };
  [key: string]: unknown;
};

type UploadJourneyHandler = (req: Request, res: Response) => void;
type PartialRequestWithSession = {
  params?: Record<string, string>;
  body?: unknown;
  session?: MockSession;
  [key: string]: unknown;
};

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
      `${RouteNames.uploadJourney}/document-type-selection/add`,
      expect.any(Function),
      expect.any(Function)
    );
    expect(mockDelete).toHaveBeenCalledWith(
      `${RouteNames.uploadJourney}/document-type-selection/remove/:index`,
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
        session: {},
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/before-you-start', {
        data: { selectedDocumentTypes: [] },
        errors: {},
        values: { selectedDocumentTypes: [], fdrHearing: undefined },
        previousStep: null,
        email: 'FRCexample@justice.gov.uk',
      });
    });

    it('should render FDR step with session data', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {
          DocumentSelection: {
            isFinancialDisputeResolution: true,
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/fdr', {
        data: { selectedDocumentTypes: [] },
        errors: {},
        values: { selectedDocumentTypes: [], fdrHearing: true },
        previousStep: UploadStepNames.Confidentiality,
        email: 'FRCexample@justice.gov.uk',
      });
    });

    it('should populate document labels from document types', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.DocumentTypeSelection },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'points-of-claim-defence' } },
            ],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/document-type-selection', {
        data: { selectedDocumentTypes: expect.arrayContaining([
          expect.objectContaining({
            label: 'Points of claim/defence',
            value: 'points-of-claim-defence',
          }),
        ]) },
        errors: {},
        values: expect.objectContaining({
          selectedDocumentTypes: expect.arrayContaining([
            expect.objectContaining({
              label: 'Points of claim/defence',
              value: 'points-of-claim-defence',
            }),
          ]),
        }),
        previousStep: UploadStepNames.FDR,
        email: 'FRCexample@justice.gov.uk',
      });
    });

    it('should handle unknown document type with empty label', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.DocumentTypeSelection },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'unknown-doc-type' } },
            ],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/document-type-selection', 
        expect.objectContaining({
          data: { selectedDocumentTypes: expect.arrayContaining([
            expect.objectContaining({
              label: '',
              value: 'unknown-doc-type',
            }),
          ]) },
        })
      );
    });

    it('should handle missing DocumentType with empty label and value', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.DocumentTypeSelection },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: {} },
            ],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/document-type-selection', 
        expect.objectContaining({
          data: { selectedDocumentTypes: expect.arrayContaining([
            expect.objectContaining({
              label: '',
              value: '',
            }),
          ]) },
        })
      );
    });

    it('should return 404 for invalid step', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'invalid-step' },
        session: {},
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith('Step not found');
    });
  });

  describe('POST /upload/:stepId', () => {
    it('should return 404 for invalid step', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'invalid-step' },
        session: {},
        body: {},
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should redirect to next step from before-you-start', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.BeforeYouStart },
        session: {},
        body: {},
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/confidentiality`);
    });

    it('should redirect to next step from FDR', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {},
        body: { fdrHearing: 'yes' },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-type-selection`);
    });

    it('should handle validation errors', () => {
      const { uploadSteps } = require('../../../main/upload-journey/config');
      uploadSteps[UploadStepNames.Confidentiality].validate = () => ({ error: 'Test error' });

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.Confidentiality },
        session: {},
        body: {},
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalled();

      delete uploadSteps[UploadStepNames.Confidentiality].validate;
    });

    it('should store fdrHearing in session', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {},
        body: { fdrHearing: 'true' },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.DocumentSelection?.isFinancialDisputeResolution).toBe(true);
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-type-selection`);
    });

    it('should handle missing session', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.BeforeYouStart },
        session: undefined,
        body: {},
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalled();
    });

    it('should persist FDR hearing selection', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {},
        body: { fdrHearing: 'true' },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.DocumentSelection?.isFinancialDisputeResolution).toBe(true);
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-type-selection`);
    });

    it('should persist FDR hearing selection as no', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {},
        body: { fdrHearing: 'false' },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.DocumentSelection?.isFinancialDisputeResolution).toBe(false);
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-type-selection`);
    });

    it('should render validation error with fdrHearing value from body', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.DocumentTypeSelection },
        session: {},
        body: { fdrHearing: 'false' },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith(
        'upload-journey/document-type-selection',
        expect.objectContaining({
          values: expect.objectContaining({
            fdrHearing: false,
          }),
        })
      );
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

  describe('POST /upload/document-type-selection/add', () => {
    it('should add document to session', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/document-type-selection/add`);
      const mockReq = {
        session: {},
        body: { id: 1, label: 'Payslips', value: 'payslips' },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.DocumentSelection?.documentDetails).toHaveLength(1);
      expect(mockReq.session?.DocumentSelection?.documentDetails?.[0].value?.DocumentType).toBe('payslips');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: expect.arrayContaining([expect.objectContaining({ label: 'Payslips', value: 'payslips' })]),
      });
    });

    it('should append to existing documents', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/document-type-selection/add`);
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [{ id: 'uuid-1', value: { DocumentType: 'payslips' } }],
          },
        },
        body: { id: 2, label: 'Bank statements', value: 'bank-statements' },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.DocumentSelection?.documentDetails).toHaveLength(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: expect.arrayContaining([
          expect.objectContaining({ label: 'Payslips', value: 'payslips' }),
          expect.objectContaining({ label: 'Bank statements', value: 'bank-statements' }),
        ]),
      });
    });

    // Edge case: handles malformed session data where DocumentType is missing
    it('should handle documents with missing DocumentType', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/document-type-selection/add`);
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [{ id: 'uuid-1', value: {} }],
          },
        },
        body: { id: 2, label: 'Test', value: 'TEST' },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: expect.arrayContaining([
          expect.objectContaining({ value: '' }),
          expect.objectContaining({ value: 'TEST' }),
        ]),
      });
    });
  });

  describe('DELETE /upload/document-type-selection/remove/:index', () => {
    it('should remove document from session', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-type-selection/remove/:index`);
      const mockReq = {
        params: { index: '0' },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'PAYSLIPS' } },
              { id: 'uuid-2', value: { DocumentType: 'BANK_STATEMENTS' } },
            ],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.DocumentSelection?.documentDetails).toHaveLength(1);
      expect(mockReq.session?.DocumentSelection?.documentDetails?.[0].value?.DocumentType).toBe('BANK_STATEMENTS');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: expect.arrayContaining([expect.objectContaining({ value: 'BANK_STATEMENTS' })]),
      });
    });

    it('should handle invalid index', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-type-selection/remove/:index`);
      const mockReq = {
        params: { index: '99' },
        session: {
          DocumentSelection: {
            documentDetails: [{ id: 'uuid-1', value: { DocumentType: 'PAYSLIPS' } }],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.DocumentSelection?.documentDetails).toHaveLength(1);
      expect(mockReq.session?.DocumentSelection?.documentDetails?.[0].value?.DocumentType).toBe('PAYSLIPS');
    });

    it('should handle when DocumentSelection is undefined', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-type-selection/remove/:index`);
      const mockReq = {
        params: { index: '0' },
        session: {},
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: [],
      });
    });

    it('should update session when removing document with valid DocumentSelection', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-type-selection/remove/:index`);
      const documentDetails = [
        { id: 'uuid-1', value: { DocumentType: 'points-of-claim-defence' } },
        { id: 'uuid-2', value: { DocumentType: 'other-document' } },
      ];
      const mockReq = {
        params: { index: '0' },
        session: {
          DocumentSelection: {
            documentDetails: [...documentDetails],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.DocumentSelection?.documentDetails).toHaveLength(1);
      expect(mockReq.session?.DocumentSelection?.documentDetails?.[0].id).toBe('uuid-2');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        documents: [
          expect.objectContaining({
            id: 'uuid-2',
            label: 'Other document',
            value: 'other-document',
          }),
        ],
      });
    });
  });
});
