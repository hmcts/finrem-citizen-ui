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
  documents?: {
    isFinancialDisputeResolution?: boolean;
    documentDetails?: { 
      id?: string; 
      value?: { 
        DocumentType?: string;
        DocumentFileName?: string;
        DocumentLink?: { document_url?: string };
      } 
    }[];
  };
  uploadErrors?: Record<string, string>;
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

    it('should render check-upload step with document groups', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'doc-1', value: { DocumentType: 'bank-statements' } },
            ],
          },
          documents: {
            documentDetails: [
              {
                id: 'file-1',
                value: {
                  DocumentType: 'bank-statements',
                  DocumentFileName: 'statement1.pdf',
                  DocumentLink: {
                    document_url: 'http://example.com/documents/file1',
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

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/check-upload', expect.objectContaining({
        data: expect.objectContaining({
          documentGroups: expect.any(Array),
        }),
        previousStep: UploadStepNames.UploadDocuments,
      }));
    });

    it('should clear upload errors from session after rendering', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.UploadDocuments },
        session: {
          uploadErrors: { someError: 'Error message' },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.uploadErrors).toBeUndefined();
      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/upload-documents', expect.objectContaining({
        errors: { someError: 'Error message' },
      }));
    });

    it('should render check-upload with documents that do not have rename formats', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'doc-1', value: { DocumentType: 'Payslips' } },
            ],
          },
          documents: {
            documentDetails: [
              {
                id: 'file-1',
                value: {
                  DocumentType: 'Payslips',
                  DocumentFileName: 'my-payslip.pdf',
                  DocumentLink: {
                    document_url: 'http://example.com/documents/file1',
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

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/check-upload', expect.objectContaining({
        data: expect.objectContaining({
          documentGroups: expect.arrayContaining([
            expect.objectContaining({
              files: expect.arrayContaining([
                expect.objectContaining({
                  displayFilename: 'my-payslip.pdf',
                }),
              ]),
            }),
          ]),
        }),
      }));
    });

    it('should render check-upload with auto-renamed documents', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {
          caseUserName: 'JohnSmith',
          DocumentSelection: {
            documentDetails: [
              { id: 'doc-1', value: { DocumentType: 'Family mediation information and assessment meeting (MIAM) form (Form FM1)' } },
            ],
          },
          documents: {
            documentDetails: [
              {
                id: 'file-1',
                value: {
                  DocumentType: 'Family mediation information and assessment meeting (MIAM) form (Form FM1)',
                  DocumentFileName: 'JohnSmith-FormFM1-23-06-2026.pdf',
                  DocumentLink: {
                    document_url: 'http://example.com/documents/file1',
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

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/check-upload', expect.objectContaining({
        data: expect.objectContaining({
          uploadedFiles: expect.objectContaining({
            'family-mediation-information-and-assessment-meeting-miam-form-form-fm1': expect.arrayContaining([
              expect.objectContaining({
                displayFilename: expect.stringContaining('JohnSmith-FormFM1'),
              }),
            ]),
          }),
        }),
      }));
    });

    it('should render check-upload with auto-renamed documents in documentGroups', () => {
      const handler = getRegisteredHandler(mockGet, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {
          caseUserName: 'JohnSmith',
          DocumentSelection: {
            documentDetails: [
              { id: 'doc-1', value: { DocumentType: 'Family mediation information and assessment meeting (MIAM) form (Form FM1)' } },
            ],
          },
          documents: {
            documentDetails: [
              {
                id: 'file-1',
                value: {
                  DocumentType: 'Family mediation information and assessment meeting (MIAM) form (Form FM1)',
                  DocumentFileName: 'JohnSmith-FormFM1-23-06-2026.pdf',
                  DocumentLink: {
                    document_url: 'http://example.com/documents/file1',
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

      expect(mockRes.render).toHaveBeenCalledWith('upload-journey/check-upload', expect.objectContaining({
        data: expect.objectContaining({
          documentGroups: expect.arrayContaining([
            expect.objectContaining({
              files: expect.arrayContaining([
                expect.objectContaining({
                  displayFilename: expect.stringContaining('JohnSmith-FormFM1'),
                }),
              ]),
            }),
          ]),
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

    it('should render validation error when uploadMore is missing on check-upload', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {},
        body: {},
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.render).toHaveBeenCalledWith(
        'upload-journey/check-upload',
        expect.objectContaining({
          errors: {
            uploadMore: 'Select yes if you want to upload any other documents',
          },
          values: expect.objectContaining({
            uploadMore: undefined,
          }),
        })
      );
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to document-type-selection when user selects yes on check-upload', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
        body: { uploadMore: 'yes' },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/document-type-selection`);
      expect(mockRes.render).not.toHaveBeenCalled();
    });

    it('should redirect to send-to-other-party when user selects no on check-upload', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
        body: { uploadMore: 'no' },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/send-to-other-party`);
      expect(mockRes.render).not.toHaveBeenCalled();
    });

    it('should render check-upload with uploadMore value when validation fails', () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.CheckUpload },
        session: {
          documents: {
            documentDetails: [
              {
                id: 'file-1',
                value: {
                  DocumentType: 'bank-statements',
                  DocumentFileName: 'statement.pdf',
                  DocumentLink: {
                    document_url: 'http://example.com/documents/file1',
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

      expect(mockRes.render).toHaveBeenCalledWith(
        'upload-journey/check-upload',
        expect.objectContaining({
          data: expect.objectContaining({
            documentGroups: expect.any(Array),
          }),
          errors: {
            uploadMore: 'Select yes if you want to upload any other documents',
          },
          values: expect.objectContaining({
            uploadMore: undefined,
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
        body: { uploadMore: 'yes' },
      } as PartialRequestWithSession;
      const mockRes = {
        render: jest.fn(),
        redirect: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/${UploadStepNames.CheckUpload}`);

      uploadSteps[UploadStepNames.CheckUpload].next = originalNext;
    });

    it('should throw error when session save fails', async () => {
      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: UploadStepNames.BeforeYouStart },
        session: {
          save: jest.fn((callback: (err?: Error) => void) => callback(new Error('Session save failed'))),
        },
        body: {},
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      await expect(handler(mockReq as unknown as Request, mockRes as Response)).rejects.toThrow('Session save failed');
    });

    it('should submit documents to CCD when send-to-other-party is submitted', async () => {
      // @ts-ignore - Jest mock typing issue
      const mockLinkDocumentsToCase = jest.fn().mockResolvedValue(undefined) as jest.Mock;
      (DocumentManagerController as unknown as jest.Mock).mockImplementationOnce(() => ({
        LinkDocumentsToCase: mockLinkDocumentsToCase,
      }));

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'send-to-other-party' },
        session: {
          DocumentSelection: {
            isFinancialDisputeResolution: true,
            documentDetails: [{ id: '1', value: { DocumentType: 'Chronology' } }],
          },
          documents: {
            documentDetails: [
              {
                id: 'doc1',
                value: {
                  DocumentFileName: 'test.pdf',
                  DocumentType: 'Chronology',
                  DocumentLink: { document_url: 'http://dm-store/doc1' },
                },
              },
            ],
          },
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
        body: { understand: 'yes' },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      await handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockLinkDocumentsToCase).toHaveBeenCalledWith(mockReq);
      expect(mockReq.session?.documents?.isFinancialDisputeResolution).toBe(true);
      expect(mockReq.session?.DocumentSelection).toBeUndefined();
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/confirmation`);
    });

    it('should handle send-to-other-party submission without DocumentSelection', async () => {
      // @ts-ignore - Jest mock typing issue
      const mockLinkDocumentsToCase = jest.fn().mockResolvedValue(undefined) as jest.Mock;
      (DocumentManagerController as unknown as jest.Mock).mockImplementationOnce(() => ({
        LinkDocumentsToCase: mockLinkDocumentsToCase,
      }));

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'send-to-other-party' },
        session: {
          documents: {
            documentDetails: [
              {
                id: 'doc1',
                value: {
                  DocumentFileName: 'test.pdf',
                  DocumentType: 'Chronology',
                  DocumentLink: { document_url: 'http://dm-store/doc1' },
                },
              },
            ],
          },
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
        body: { understand: 'yes' },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      await handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockLinkDocumentsToCase).toHaveBeenCalledWith(mockReq);
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/confirmation`);
    });

    it('should throw error when LinkDocumentsToCase fails', async () => {
      // @ts-ignore - Jest mock typing issue
      const mockLinkDocumentsToCase = jest.fn().mockRejectedValue(new Error('CCD submission failed')) as jest.Mock;
      (DocumentManagerController as unknown as jest.Mock).mockImplementationOnce(() => ({
        LinkDocumentsToCase: mockLinkDocumentsToCase,
      }));

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'send-to-other-party' },
        session: {
          DocumentSelection: {
            isFinancialDisputeResolution: true,
          },
          documents: {
            documentDetails: [
              {
                id: 'doc1',
                value: {
                  DocumentFileName: 'test.pdf',
                  DocumentType: 'Chronology',
                  DocumentLink: { document_url: 'http://dm-store/doc1' },
                },
              },
            ],
          },
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
        body: { understand: 'yes' },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      await expect(handler(mockReq as unknown as Request, mockRes as Response)).rejects.toThrow('CCD submission failed');
    });

    it('should create documents object when it does not exist', async () => {
      // @ts-ignore - Jest mock typing issue
      const mockLinkDocumentsToCase = jest.fn().mockResolvedValue(undefined) as jest.Mock;
      (DocumentManagerController as unknown as jest.Mock).mockImplementationOnce(() => ({
        LinkDocumentsToCase: mockLinkDocumentsToCase,
      }));

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'send-to-other-party' },
        session: {
          DocumentSelection: {
            isFinancialDisputeResolution: true,
          },
          // No documents object
          save: jest.fn((callback: (err?: Error) => void) => callback()),
        },
        body: { understand: 'yes' },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      await handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.documents).toBeDefined();
      expect(mockReq.session?.documents?.isFinancialDisputeResolution).toBe(true);
      expect(mockRes.redirect).toHaveBeenCalledWith(`${RouteNames.uploadJourney}/confirmation`);
    });

    it('should throw error when session save fails after submission', async () => {
      // @ts-ignore - Jest mock typing issue
      const mockLinkDocumentsToCase = jest.fn().mockResolvedValue(undefined) as jest.Mock;
      (DocumentManagerController as unknown as jest.Mock).mockImplementationOnce(() => ({
        LinkDocumentsToCase: mockLinkDocumentsToCase,
      }));

      const handler = getRegisteredHandler(mockPost, `${RouteNames.uploadJourney}/:stepId`);
      const mockReq = {
        params: { stepId: 'send-to-other-party' },
        session: {
          documents: {
            documentDetails: [
              {
                id: 'doc1',
                value: {
                  DocumentFileName: 'test.pdf',
                  DocumentType: 'Chronology',
                  DocumentLink: { document_url: 'http://dm-store/doc1' },
                },
              },
            ],
          },
          save: jest.fn((callback: (err?: Error) => void) => callback(new Error('Session save failed'))),
        },
        body: { understand: 'yes' },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;

      await expect(handler(mockReq as unknown as Request, mockRes as Response)).rejects.toThrow('Session save failed');
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
      const mockSave = jest.fn((callback: (err?: Error) => void) => callback());
      const mockReq = {
        params: { index: '0' },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'PAYSLIPS' } },
              { id: 'uuid-2', value: { DocumentType: 'BANK_STATEMENTS' } },
            ],
          },
          save: mockSave,
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
      const mockSave = jest.fn((callback: (err?: Error) => void) => callback());
      const mockReq = {
        params: { index: '99' },
        session: {
          DocumentSelection: {
            documentDetails: [{ id: 'uuid-1', value: { DocumentType: 'PAYSLIPS' } }],
          },
          save: mockSave,
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
      const mockSave = jest.fn((callback: (err?: Error) => void) => callback());
      const mockReq = {
        params: { index: '0' },
        session: {
          save: mockSave,
        },
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
      const mockSave = jest.fn((callback: (err?: Error) => void) => callback());
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
          save: mockSave,
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

    it('should remove uploaded files for the removed document type', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-type-selection/remove/:index`);
      const mockSave = jest.fn((callback: (err?: Error) => void) => callback());
      const mockReq = {
        params: { index: '0' },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'mortgage-statements' } }, // kebab-case
              { id: 'uuid-2', value: { DocumentType: 'bank-statements' } }, // kebab-case
            ],
          },
          documents: {
            documentDetails: [
              { id: 'doc1', value: { DocumentType: 'Mortgage statements' } }, // enum value
              { id: 'doc2', value: { DocumentType: 'Bank statements' } }, // enum value
            ],
          },
          save: mockSave,
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.documents?.documentDetails).toHaveLength(1);
      expect(mockReq.session?.documents?.documentDetails?.[0].value?.DocumentType).toBe('Bank statements');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should clear upload errors for the removed document type', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-type-selection/remove/:index`);
      const mockSave = jest.fn((callback: (err?: Error) => void) => callback());
      const mockReq = {
        params: { index: '0' },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'Mortgage statements' } },
            ],
          },
          uploadErrors: {
            'Mortgage statements': 'Some error',
            'Other': 'Another error',
          },
          save: mockSave,
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.uploadErrors?.['Mortgage statements']).toBeUndefined();
      expect(mockReq.session?.uploadErrors?.['Other']).toBe('Another error');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should remove all uploaded files for a document type with multiple files', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-type-selection/remove/:index`);
      const mockSave = jest.fn((callback: (err?: Error) => void) => callback());
      const mockReq = {
        params: { index: '1' }, // Remove chronology (index 1)
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'bank-statements' } },
              { id: 'uuid-2', value: { DocumentType: 'chronology' } },
              { id: 'uuid-3', value: { DocumentType: 'mortgage-statements' } },
            ],
          },
          documents: {
            documentDetails: [
              { id: 'doc1', value: { DocumentType: 'Bank statements', DocumentFileName: 'bank1.pdf' } },
              { id: 'doc2', value: { DocumentType: 'Chronology', DocumentFileName: 'chrono1.pdf' } },
              { id: 'doc3', value: { DocumentType: 'Chronology', DocumentFileName: 'chrono2.pdf' } },
              { id: 'doc4', value: { DocumentType: 'Chronology', DocumentFileName: 'chrono3.pdf' } },
              { id: 'doc5', value: { DocumentType: 'Mortgage statements', DocumentFileName: 'mortgage1.pdf' } },
            ],
          },
          save: mockSave,
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      // Should remove all 3 Chronology files, leaving only Bank statements and Mortgage statements
      expect(mockReq.session?.documents?.documentDetails).toHaveLength(2);
      expect(mockReq.session?.documents?.documentDetails?.[0].value?.DocumentType).toBe('Bank statements');
      expect(mockReq.session?.documents?.documentDetails?.[1].value?.DocumentType).toBe('Mortgage statements');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle session save errors', () => {
      const handler = getRegisteredHandler(mockDelete, `${RouteNames.uploadJourney}/document-type-selection/remove/:index`);
      const mockSave = jest.fn((callback: (err?: Error) => void) => callback(new Error('Save failed')));
      const mockReq = {
        params: { index: '0' },
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'MORTGAGE' } },
            ],
          },
          save: mockSave,
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to save session',
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
    it.each([
      [CaseRole.RESPONDENT, 'citizenRespondentDocument'],
      [CaseRole.APPLICANT, 'citizenApplicantDocument'],
    ])(
      'should render plain text when document URL does not contain a valid document id for %s',
      async (caseRole, documentCollectionKey) => {
        const mockResponse = {
          case_details: {
            case_data: {
              [documentCollectionKey]: [
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
              caseRole,
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
                { text: '15 June 2026 at 8:11am' },
                { text: 'Statement of issues' },
                { text: 'Test-Demo.docx' },
              ],
            ],
          }
        );

        expect(next).not.toHaveBeenCalled();
      }
    );
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
    it('should call next with error when caseRole is not in session', async () => {
      setupUploadJourneyRoute(app);

      const handler = getRegisteredHandler(
        mockGet,
        `${RouteNames.uploadJourney}/previously-uploaded-documents`
      );

      const mockReq = {
        session: {
          caseNumber: '123',
          user: {}, // no caseRole
        },
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
          message: 'No case role in session',
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
    it('should call next with error when case role is unsupported', async () => {
      const mockResponse = {
        case_details: {
          case_data: {
            citizenApplicantDocument: [],
            citizenRespondentDocument: [],
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
            caseRole: 'INVALID_ROLE',
          },
        },
      } as unknown as Request;

      const mockRes = {
        render: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await handler(mockReq, mockRes, next);

      expect(mockRes.render).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unsupported case role: INVALID_ROLE',
        })
      );
    });
    it.each([
      ['missing document URL', undefined],
      ['invalid document URL', 'http://[invalid'],
    ])(
      'should render plain text when %s',
      async (_scenario, documentUrl) => {
        const mockResponse = {
          case_details: {
            case_data: {
              citizenRespondentDocument: [
                {
                  value: {
                    DocumentLink: {
                      document_url: documentUrl,
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
                { text: '15 June 2026 at 8:11am' },
                { text: 'Statement of issues' },
                { text: 'Test-Demo.docx' },
              ],
            ],
          }
        );

        expect(next).not.toHaveBeenCalled();
      }
    );
  });
});
