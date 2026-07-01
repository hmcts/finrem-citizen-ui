import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Application, Request, Response } from 'express';

import { CitizenUploadDocumentType } from '../../../main/app/case/definition';
import { RouteNames } from '../../../main/common-constants';

// Mock the DocumentManagerController
const mockUploadDocumentToEvidenceStore = jest.fn();
jest.mock('../../../main/app/document/DocumentManagerController', () => ({
  DocumentManagerController: jest.fn().mockImplementation(() => ({
    uploadDocumentToEvidenceStore: mockUploadDocumentToEvidenceStore,
  })),
}));

type MockSession = {
  documents?: {
    documentDetails?: { id?: string; value?: { DocumentType?: string; DocumentFileName?: string } }[];
    isFinancialDisputeResolution?: boolean;
  };
  [key: string]: unknown;
};

type HomeHandler = (req: Request, res: Response, next?: (error?: unknown) => void) => void;
type PartialRequestWithSession = {
  params?: Record<string, string>;
  body?: unknown;
  session?: MockSession;
  [key: string]: unknown;
};

function getRegisteredHandler(mockFn: jest.Mock, route: string): HomeHandler {
  const call = mockFn.mock.calls.find((entry: unknown[]) => entry[0] === route);

  if (!call) {
    throw new Error(`Expected route handler for ${route} to be registered`);
  }

  return call[call.length - 1] as HomeHandler;
}

describe('Home Routes', () => {
  let app: Application;
  let mockDelete: jest.Mock;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.resetModules();
    mockDelete = jest.fn();
    app = {
      get: jest.fn(),
      post: jest.fn(),
      delete: mockDelete,
    } as unknown as Application;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('DELETE /documents/remove/:fileId', () => {
    it('should remove document from session', () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockDelete, RouteNames.documentRemove);
      const mockReq = {
        params: { fileId: 'file-123' },
        session: {
          documents: {
            documentDetails: [
              { id: 'file-123', value: { DocumentType: 'chronology', DocumentFileName: 'test.pdf' } },
              { id: 'file-456', value: { DocumentType: 'position-statement', DocumentFileName: 'statement.pdf' } },
            ],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.documents?.documentDetails).toHaveLength(1);
      expect(mockReq.session?.documents?.documentDetails?.[0].id).toBe('file-456');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        fileId: 'file-123',
        remainingCount: 1,
      });
    });

    it('should handle missing session gracefully', () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockDelete, RouteNames.documentRemove);
      const mockReq = {
        params: { fileId: 'file-123' },
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

    it('should handle non-existent fileId', () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockDelete, RouteNames.documentRemove);
      const mockReq = {
        params: { fileId: 'non-existent' },
        session: {
          documents: {
            documentDetails: [
              { id: 'file-123', value: { DocumentType: 'chronology', DocumentFileName: 'test.pdf' } },
              { id: 'file-456', value: { DocumentType: 'position-statement', DocumentFileName: 'statement.pdf' } },
            ],
          },
        },
      } as PartialRequestWithSession;
      const mockRes = {
        json: jest.fn(),
      } as Partial<Response>;

      handler(mockReq as unknown as Request, mockRes as Response);

      expect(mockReq.session?.documents?.documentDetails).toHaveLength(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        fileId: 'non-existent',
        remainingCount: 2,
      });
    });
  });

  describe('POST /documents/upload', () => {
    let mockPost: jest.Mock;

    beforeEach(() => {
      mockPost = jest.fn();
      app = {
        get: jest.fn(),
        post: mockPost,
        delete: jest.fn(),
      } as unknown as Application;
      mockUploadDocumentToEvidenceStore.mockReset();
    });

    it('should reject invalid file type', async () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.txt', size: 1024 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'Your file must be in jpg, png, pdf, docx, or xlsx format',
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should reject file over 100MB', async () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.pdf', size: 101 * 1024 * 1024 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'Your file must be smaller than 100MB',
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should reject empty file', async () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.pdf', size: 0 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'The selected file is empty',
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should reject password protected file', async () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [
          {
            originalname: 'test.pdf',
            size: 1024,
            buffer: Buffer.from('%PDF-1.7\n1 0 obj\n<< /Encrypt 2 0 R >>\nendobj'),
          },
        ],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'The selected file must not be password protected',
      });
      expect(mockUploadDocumentToEvidenceStore).not.toHaveBeenCalled();
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should reject when no file is provided', async () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'You must upload at least one file before continuing',
      });
      expect(mockUploadDocumentToEvidenceStore).not.toHaveBeenCalled();
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should use default returnUrl when not provided', async () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.txt', size: 1024 }],
        body: { documentType: 'form-fm1' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith(RouteNames.documents);
    });

    it('should handle CDAM upload errors', async () => {
      mockUploadDocumentToEvidenceStore.mockRejectedValueOnce(new Error('CDAM API error') as never);

      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.pdf', size: 1024 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'The selected file could not be uploaded - try again',
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should clear errors on successful upload when multiple errors exist', async () => {
      mockUploadDocumentToEvidenceStore.mockResolvedValueOnce(undefined as never);

      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.pdf', size: 1024 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          uploadErrors: { 'form-fm1': 'Old error', 'other-doc': 'Other error' },
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      // Should clear only the error for this document type
      expect(mockReq.session?.uploadErrors).toEqual({ 'other-doc': 'Other error' });
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should remove uploadErrors object when last error is cleared', async () => {
      mockUploadDocumentToEvidenceStore.mockResolvedValueOnce(undefined as never);

      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.pdf', size: 1024 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          uploadErrors: { 'form-fm1': 'Old error' },
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      // Should remove uploadErrors entirely
      expect(mockReq.session?.uploadErrors).toBeUndefined();
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should handle session save errors', async () => {
      mockUploadDocumentToEvidenceStore.mockResolvedValueOnce(undefined as never);

      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const saveError = new Error('Session save failed');
      const mockReq = {
        files: [{ originalname: 'test.pdf', size: 1024 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb(saveError)),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(saveError);
    });

    it('should handle multer file size limit errors at validation layer', async () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      
      const mockReq = {
        files: [{ originalname: 'huge.pdf', size: 101 * 1024 * 1024 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      // Our validation should catch it
      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'Your file must be smaller than 100MB',
      });
    });

    it('should handle successful upload without previous errors', async () => {
      mockUploadDocumentToEvidenceStore.mockResolvedValueOnce(undefined as never);

      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.pdf', size: 1024 }],
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      // Should not have uploadErrors
      expect(mockReq.session?.uploadErrors).toBeUndefined();
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should resolve documentType when sent as an enum value', async () => {
      mockUploadDocumentToEvidenceStore.mockResolvedValueOnce(undefined as never);

      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'test.pdf', size: 1024 }],
        body: { documentType: CitizenUploadDocumentType.BANK_STATEMENTS, returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockUploadDocumentToEvidenceStore).toHaveBeenCalledWith(
        expect.anything(),
        CitizenUploadDocumentType.BANK_STATEMENTS
      );
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should accept file exactly at 100MB limit', async () => {
      mockUploadDocumentToEvidenceStore.mockResolvedValueOnce(undefined as never);

      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const handler = getRegisteredHandler(mockPost, RouteNames.documentUpload);
      const mockReq = {
        files: [{ originalname: 'large.pdf', size: 100 * 1024 * 1024 }], // Exactly 100MB
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      await handler(mockReq as unknown as Request, mockRes as Response, mockNext);

      // Should accept file at exactly 100MB
      expect(mockReq.session?.uploadErrors).toBeUndefined();
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should handle Multer LIMIT_FILE_SIZE error in error handler middleware', () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      // Find the error-handling middleware by its arity (4 args: err, req, res, next)
      const postCalls = (app.post as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === RouteNames.documentUpload
      );
      const errorHandler = postCalls[0].find(
        (h: unknown) => typeof h === 'function' && (h as (...args: unknown[]) => void).length === 4
      ) as (err: Error, req: Request, res: Response, next: (error?: Error) => void) => void;

      const multer = require('multer');
      const multerError = new multer.MulterError('LIMIT_FILE_SIZE', 'file');
      
      const mockReq = {
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      
      const mockNext = jest.fn();

      errorHandler(multerError, mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'Your file must be smaller than 100MB',
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
    });

    it('should handle other Multer errors in error handler middleware', () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const postCalls = (app.post as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === RouteNames.documentUpload
      );
      const errorHandler = postCalls[0].find(
        (h: unknown) => typeof h === 'function' && (h as (...args: unknown[]) => void).length === 4
      ) as (err: Error, req: Request, res: Response, next: (error?: Error) => void) => void;

      const multer = require('multer');
      const multerError = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file');
      
      const mockReq = {
        body: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      
      const mockNext = jest.fn();

      errorHandler(multerError, mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'The selected file could not be uploaded - try again',
      });
    });

    it('should pass non-Multer errors to next handler', () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const postCalls = (app.post as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === RouteNames.documentUpload
      );
      const errorHandler = postCalls[0].find(
        (h: unknown) => typeof h === 'function' && (h as (...args: unknown[]) => void).length === 4
      ) as (err: Error, req: Request, res: Response, next: (error?: Error) => void) => void;

      const genericError = new Error('Some other error');
      
      const mockReq = {
        body: { documentType: 'form-fm1' },
        session: {},
      } as PartialRequestWithSession;
      
      const mockRes = {} as Partial<Response>;
      const mockNext = jest.fn();

      errorHandler(genericError, mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(genericError);
    });

    it('should reject oversized uploads via Content-Length pre-check', () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const postCalls = (app.post as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === RouteNames.documentUpload
      );
      // checkContentLength is registered after the route path and oidcMiddleware
      const checkContentLength = postCalls[0][2] as HomeHandler;

      const mockReq = {
        headers: { 'content-length': String(200 * 1024 * 1024) },
        query: { documentType: 'form-fm1', returnUrl: '/upload/upload-documents' },
        body: {},
        session: {
          save: jest.fn((cb: (err?: Error) => void) => cb()),
        },
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      checkContentLength(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockReq.session?.uploadErrors).toEqual({
        'form-fm1': 'Your file must be smaller than 100MB',
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('/upload/upload-documents');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass through Content-Length pre-check when within limit', () => {
      const homeRoutes = require('../../../main/routes/home').default;
      homeRoutes(app);

      const postCalls = (app.post as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === RouteNames.documentUpload
      );
      const checkContentLength = postCalls[0][2] as HomeHandler;

      const mockReq = {
        headers: { 'content-length': String(50 * 1024 * 1024) },
        query: {},
        body: {},
        session: {},
      } as PartialRequestWithSession;
      const mockRes = {
        redirect: jest.fn(),
      } as Partial<Response>;
      const mockNext = jest.fn();

      checkContentLength(mockReq as unknown as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.redirect).not.toHaveBeenCalled();
      expect(mockReq.session?.uploadErrors).toBeUndefined();
    });
  });
});
