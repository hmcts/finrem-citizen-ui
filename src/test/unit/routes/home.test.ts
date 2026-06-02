import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Application, Request, Response } from 'express';

import { RouteNames } from '../../../main/common-constants';

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
});
