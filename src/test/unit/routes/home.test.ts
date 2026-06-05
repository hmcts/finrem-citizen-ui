import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Application, Request, Response } from 'express';

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
    jest.resetModules();
    mockDelete = jest.fn();
    app = {
      get: jest.fn(),
      post: jest.fn(),
      delete: mockDelete,
    } as unknown as Application;
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
  });
});
