import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Application, NextFunction, Request, Response } from 'express';

import { CaseRole } from '../../../main/app/case/definition';
import { DocumentManagerController } from '../../../main/app/document/DocumentManagerController';
import { RouteNames, UploadStepNames } from '../../../main/common-constants';
import setupUploadJourneyRoute from '../../../main/routes/upload-journey';

jest.mock('../../../main/app/document/DocumentManagerController', () => ({
  DocumentManagerController: jest.fn().mockImplementation(() => ({
    previouslyUploadedDocuments: jest.fn(),
  })),
}));

type MockSession = {
  DocumentSelection?: {
    isFinancialDisputeResolution?: boolean;
    documentDetails?: { id?: string; value?: { DocumentType?: string } }[];
  };
  save?: (callback: (err?: Error) => void) => void;
  [key: string]: unknown;
};

type UploadJourneyHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;
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
    expect(mockGet).toHaveBeenCalledWith(
      `${RouteNames.uploadJourney}/previously-uploaded-documents`,
      expect.any(Function),
      expect.any(Function)
    );
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

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/before-you-start', expect.objectContaining({
        data: { selectedDocumentTypes: [], uploadedFiles: {} },
        errors: {},
        values: { selectedDocumentTypes: [], fdrHearing: undefined },
        previousStep: null,
        email: 'FRCexample@justice.gov.uk',
      }));
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

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/fdr', expect.objectContaining({
        data: { selectedDocumentTypes: [], uploadedFiles: {} },
        errors: {},
        values: { selectedDocumentTypes: [], fdrHearing: true },
        previousStep: UploadStepNames.Confidentiality,
        email: 'FRCexample@justice.gov.uk',
      }));
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

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/document-type-selection', expect.objectContaining({
        data: expect.objectContaining({
          selectedDocumentTypes: expect.arrayContaining([
            expect.objectContaining({
              label: 'Points of claim/defence',
              value: 'points-of-claim-defence',
            }),
          ]),
          uploadedFiles: {},
        }),
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
      }));
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
          data: expect.objectContaining({
            selectedDocumentTypes: expect.arrayContaining([
              expect.objectContaining({
                label: '',
                value: 'unknown-doc-type',
              }),
            ]),
            uploadedFiles: {},
          }),
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
          data: expect.objectContaining({
            selectedDocumentTypes: expect.arrayContaining([
              expect.objectContaining({
                label: '',
                value: '',
              }),
            ]),
            uploadedFiles: {},
          }),
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

    it('should include uploaded files grouped by document type', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.UploadDocuments },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'doc-1', value: { DocumentType: 'position-statement' } },
            ],
          },
          documents: {
            documentDetails: [
              {
                id: 'file-1',
                value: {
                  DocumentType: 'position-statement',
                  DocumentFileName: 'statement.pdf',
                  DocumentLink: {
                    document_url: 'http://example.com/documents/file1',
                  },
                },
              },
              {
                id: 'file-2',
                value: {
                  DocumentType: 'position-statement',
                  DocumentFileName: 'statement2.pdf',
                  DocumentLink: {
                    document_url: 'http://example.com/documents/file2',
                  },
                },
              },
            ],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/upload-documents', expect.objectContaining({
        data: expect.objectContaining({
          uploadedFiles: {
            'position-statement': [
              { id: 'file-1', filename: 'statement.pdf', url: '/documents/file1/download', displayFilename: expect.any(String) },
              { id: 'file-2', filename: 'statement2.pdf', url: '/documents/file2/download', displayFilename: expect.any(String) },
            ],
          },
        }),
      }));
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
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
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
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
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

    it('should include uploaded files when rendering validation errors', () => {
      const { uploadSteps } = require('../../../main/upload-journey/config');
      uploadSteps[UploadStepNames.UploadDocuments].validate = () => ({ error: 'Test error' });

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.UploadDocuments },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'doc-1', value: { DocumentType: 'chronology' } },
            ],
          },
          documents: {
            documentDetails: [
              {
                id: 'file-1',
                value: {
                  DocumentType: 'chronology',
                  DocumentFileName: 'chronology.pdf',
                  DocumentLink: {
                    document_url: 'http://example.com/documents/chronology',
                  },
                },
              },
            ],
          },
        },
        body: {},
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/upload-documents', expect.objectContaining({
        data: expect.objectContaining({
          uploadedFiles: {
            'chronology': [
              { id: 'file-1', filename: 'chronology.pdf', url: '/documents/chronology/download', displayFilename: expect.any(String) },
            ],
          },
        }),
        errors: { error: 'Test error' },
      }));

      delete uploadSteps[UploadStepNames.UploadDocuments].validate;
    });

    it('should store fdrHearing in session', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.FDR },
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
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
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
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
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
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
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
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

    it('should redirect to same step when no next step is defined', () => {
      const { uploadSteps } = require('../../../main/upload-journey/config');
      const originalNext = uploadSteps[UploadStepNames.CheckUpload].next;
      uploadSteps[UploadStepNames.CheckUpload].next = null;

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
        body: {},
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/${UploadStepNames.CheckUpload}`);

      uploadSteps[UploadStepNames.CheckUpload].next = originalNext;
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

  describe('GET /upload/previously-uploaded-documents', () => {
    it('should render previously uploaded documents', async () => {
      const mockResponse = {
        case_details: {
          case_data: {
            citizenApplicantDocument: [],
            citizenRespondentDocument: [
              {
                value: {
                  DocumentLink: {
                    document_url:
                      'http://dm-store/documents/f6b20958-b1d9-4cda-8354-8b8236ef299d',
                    upload_timestamp: '2026-06-15T08:11:58.314565476',
                    document_filename: 'Test-Demo.docx',
                  },
                  DocumentType: 'Statement of issues',
                  DocumentFileName: 'Test-Demo.docx',
                },
              },
            ],
          },
        },
      };

      const previouslyUploadedDocumentsMock = jest.fn<
        (req: unknown, res: Response, caseId: string) => Promise<typeof mockResponse>
      >();

      previouslyUploadedDocumentsMock.mockResolvedValue(mockResponse);

      (DocumentManagerController as jest.Mock).mockImplementation(() => ({
        previouslyUploadedDocuments: previouslyUploadedDocumentsMock,
      }));

      setupUploadJourneyRoute(app);

      const handler = getRegisteredHandler(
        mockGet,
        `${RouteNames.uploadJourney}/previously-uploaded-documents`
      );

      const mockReq = {
        session: {
          caseNumber: '123',
          user: {
            caseRole: CaseRole.RESPONDENT,
          },
        },
      } as unknown as Request;

      const mockRes = {
        render: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await handler(mockReq, mockRes, next);

      expect(previouslyUploadedDocumentsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          session: expect.objectContaining({
            caseNumber: '123',
          }),
        }),
        mockRes,
        '123'
      );

      expect(mockRes.render).toHaveBeenCalledWith(
        'upload-journey/previously-uploaded-documents',
        {
          documentRows: [
            [
              {
                text: '15 June 2026 at 8:11am',
              },
              {
                text: 'Statement of issues',
              },
              {
                html: '<a class="govuk-link" href="/documents/f6b20958-b1d9-4cda-8354-8b8236ef299d/download">Test-Demo.docx</a>',
              },
            ],
          ],
        }
      );

      expect(next).not.toHaveBeenCalled();
    });
    it('should escape document names before rendering link html', async () => {
      const mockResponse = {
        case_details: {
          case_data: {
            citizenRespondentDocument: [
              {
                value: {
                  DocumentLink: {
                    document_url:
                      'http://dm-store/documents/f6b20958-b1d9-4cda-8354-8b8236ef299d?download=true',
                    upload_timestamp: '2026-06-15T08:11:58.314565476',
                    document_filename: 'safe-fallback.pdf',
                  },
                  DocumentType: 'Statement of issues',
                  DocumentFileName: '<script>alert("xss")</script>.pdf',
                },
              },
            ],
          },
        },
      };

      const previouslyUploadedDocumentsMock = jest.fn<
        (req: unknown, res: Response, caseId: string) => Promise<typeof mockResponse>
      >();

      previouslyUploadedDocumentsMock.mockResolvedValue(mockResponse);

      (DocumentManagerController as jest.Mock).mockImplementation(() => ({
        previouslyUploadedDocuments: previouslyUploadedDocumentsMock,
      }));

      setupUploadJourneyRoute(app);

      const handler = getRegisteredHandler(
        mockGet,
        `${RouteNames.uploadJourney}/previously-uploaded-documents`
      );

      const mockReq = {
        session: {
          caseNumber: '123',
          user: {
            caseRole: CaseRole.RESPONDENT,
          },
        },
      } as unknown as Request;

      const mockRes = {
        render: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await handler(mockReq, mockRes, next);

      const renderData = (mockRes.render as jest.Mock).mock.calls[0][1] as {
        documentRows: { html?: string; text?: string }[][];
      };
      const documentRows = renderData.documentRows;
      const documentNameCell = documentRows[0][2];

      expect(documentNameCell.html).toBe(
        '<a class="govuk-link" href="/documents/f6b20958-b1d9-4cda-8354-8b8236ef299d/download">&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;.pdf</a>'
      );
      expect(documentNameCell.html).not.toContain('<script>');
      expect(next).not.toHaveBeenCalled();
    });
    it('should render plain text when document URL does not contain a valid document id', async () => {
      const mockResponse = {
        case_details: {
          case_data: {
            citizenRespondentDocument: [
              {
                value: {
                  DocumentLink: {
                    document_url:
                      'http://dm-store/documents/not-a-valid-document-id?download=true',
                    upload_timestamp: '2026-06-15T08:11:58.314565476',
                    document_filename: 'fallback.pdf',
                  },
                  DocumentType: 'Statement of issues',
                  DocumentFileName: 'Test-Demo.docx',
                },
              },
            ],
          },
        },
      };

      const previouslyUploadedDocumentsMock = jest.fn<
        (req: unknown, res: Response, caseId: string) => Promise<typeof mockResponse>
      >();

      previouslyUploadedDocumentsMock.mockResolvedValue(mockResponse);

      (DocumentManagerController as jest.Mock).mockImplementation(() => ({
        previouslyUploadedDocuments: previouslyUploadedDocumentsMock,
      }));

      setupUploadJourneyRoute(app);

      const handler = getRegisteredHandler(
        mockGet,
        `${RouteNames.uploadJourney}/previously-uploaded-documents`
      );

      const mockReq = {
        session: {
          caseNumber: '123',
          user: {
            caseRole: CaseRole.RESPONDENT,
          },
        },
      } as unknown as Request;

      const mockRes = {
        render: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await handler(mockReq, mockRes, next);

      expect(mockRes.render).toHaveBeenCalledWith(
        'upload-journey/previously-uploaded-documents',
        {
          documentRows: [
            [
              {
                text: '15 June 2026 at 8:11am',
              },
              {
                text: 'Statement of issues',
              },
              {
                text: 'Test-Demo.docx',
              },
            ],
          ],
        }
      );
      expect(next).not.toHaveBeenCalled();
    });
    it('should call next with error when caseNumber is not in session', async () => {
      setupUploadJourneyRoute(app);

      const handler = getRegisteredHandler(
        mockGet,
        `${RouteNames.uploadJourney}/previously-uploaded-documents`
      );

      const mockReq = {
        session: {},
      } as unknown as Request;

      const mockRes = {
        render: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await handler(mockReq, mockRes, next);

      expect(mockRes.render).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No case number in session',
        })
      );
    });
    it('should call next with error when previouslyUploadedDocuments throws', async () => {
      const error = new Error('Previously uploaded documents failed');

      const previouslyUploadedDocumentsMock = jest.fn<
        (req: unknown, res: Response, caseId: string) => Promise<never>>();

      (DocumentManagerController as jest.Mock).mockImplementation(() => ({
        previouslyUploadedDocuments: previouslyUploadedDocumentsMock,
      }));

      previouslyUploadedDocumentsMock.mockRejectedValue(error);
      setupUploadJourneyRoute(app);

      const handler = getRegisteredHandler(
        mockGet,
        `${RouteNames.uploadJourney}/previously-uploaded-documents`
      );

      const mockReq = {
        session: {
          caseNumber: '123',
          user: {
            caseRole: CaseRole.RESPONDENT,
          },
        },
      } as unknown as Request;

      const mockRes = {
        render: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await handler(mockReq, mockRes, next);

      expect(previouslyUploadedDocumentsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          session: expect.objectContaining({
            caseNumber: '123',
          }),
        }),
        mockRes,
        '123'
      );

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
