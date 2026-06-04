import { Response } from 'express';
import { LoggerInstance } from 'winston';

import { CaseRole } from '../../../../main/app/case/definition';
import { AppRequest, UserDetails } from '../../../../main/app/controller/AppRequest';
import { DocumentManagerController } from '../../../../main/app/document/DocumentManagerController';

jest.mock('../../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../../main/app/case/case-api', () => ({
  getCaseApi: jest.fn().mockReturnValue({
    triggerEvent: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('DocumentManagerController', () => {
  let mockLogger: LoggerInstance;
  let controller: DocumentManagerController;

  const userDetails: UserDetails = {
    accessToken: 'token',
    idToken: '',
    refreshToken: undefined,
    sub: '',
    email: 'test@test.com',
    givenName: 'Test',
    familyName: 'User',
    id: 'user-id',
    roles: ['citizen'],
    caseRole: CaseRole.APPLICANT,
  };

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerInstance;

    controller = new DocumentManagerController(mockLogger);
  });

  const buildRequest = (overrides: Partial<AppRequest> = {}): AppRequest =>
    ({
      session: { user: userDetails },
      headers: {},
      files: [],
      ...overrides,
    } as unknown as AppRequest);

  test('throws when no files uploaded', async () => {
    const req = buildRequest({ files: [] });

    await expect(
      controller.uploadDocumentToEvidenceStore(req, 'BANK_STATEMENTS' as never)
    ).rejects.toThrow('No files were uploaded');
  });

  test('throws when user is missing', async () => {
    const req = buildRequest({
      session: { user: undefined } as unknown as AppRequest['session'],
      files: [
        {
          buffer: Buffer.from('file'),
          originalname: 'file.pdf',
        } as Express.Multer.File,
      ],
    });

    await expect(
      controller.uploadDocumentToEvidenceStore(req, 'BANK_STATEMENTS' as never)
    ).rejects.toThrow('No user in session');
  });

  test('stores documents correctly', async () => {
    const createMock = jest.fn().mockResolvedValue([
      {
        originalDocumentName: 'file.pdf',
        _links: {
          self: { href: '/doc/1' },
          binary: { href: '/doc/1/bin' },
        },
      },
    ]);

    (controller as unknown as {
      getApiClient: () => { create: typeof createMock };
    }).getApiClient = jest.fn().mockReturnValue({ create: createMock });

    const req = buildRequest({
      files: [
        {
          buffer: Buffer.from('file'),
          originalname: 'file.pdf',
        } as Express.Multer.File,
      ],
    });

    await controller.uploadDocumentToEvidenceStore(req, 'BANK_STATEMENTS' as never);

    expect(req.session.documents?.documentDetails).toHaveLength(1);
    expect(req.session.documents?.documentDetails?.[0].id).toBe('mock-uuid');
  });

  test('appends to existing documents', async () => {
    const createMock = jest.fn().mockResolvedValue([
      {
        originalDocumentName: 'file2.pdf',
        _links: {
          self: { href: '/doc/2' },
          binary: { href: '/doc/2/bin' },
        },
      },
    ]);

    (controller as unknown as {
      getApiClient: () => { create: typeof createMock };
    }).getApiClient = jest.fn().mockReturnValue({ create: createMock });

    const req = buildRequest({
      files: [{} as Express.Multer.File],
      session: {
        user: userDetails,
        documents: {
          documentDetails: [{ id: 'existing', value: {} }],
        },
      } as unknown as AppRequest['session'],
    });

    await controller.uploadDocumentToEvidenceStore(req, 'BANK_STATEMENTS' as never);

    expect(req.session.documents?.documentDetails).toHaveLength(2);
  });

  test('throws when no case number', async () => {
    const req = buildRequest({
      session: {
        user: userDetails,
        documents: { documentDetails: [] },
      } as unknown as AppRequest['session'],
    });

    await expect(controller.LinkDocumentsToCase(req)).rejects.toThrow(
      'No caseNumber in session'
    );
  });

  test('throws when no documents', async () => {
    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        documents: { documentDetails: [] },
      } as unknown as AppRequest['session'],
    });

    await expect(controller.LinkDocumentsToCase(req)).rejects.toThrow(
      'No documents in session to send'
    );
  });

  test('triggers event and clears documents', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});

    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({
      triggerEvent: triggerEventMock,
    });

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        documents: {
          documentDetails: [{ id: '1', value: {} }],
        },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(triggerEventMock).toHaveBeenCalled();
    expect(req.session.documents).toBeUndefined();
  });

  describe('downloadDocument', () => {
    test('throws when user is missing from session', async () => {
      const req = {
        session: { user: undefined },
      } as unknown as AppRequest;

      const res = {} as Response;

      await expect(
        controller.downloadDocument(req, res, 'doc-123', '123')
      ).rejects.toThrow('No user in session');
    });

    test('calls getDocument on API client with correct params', async () => {
      const getDocumentMock = jest.fn().mockResolvedValue(undefined);

      (controller as unknown as {
        getApiClient: (user: UserDetails) => {
          getDocument: typeof getDocumentMock;
        };
      }).getApiClient = jest.fn().mockReturnValue({
        getDocument: getDocumentMock,
      });

      const req = {
        session: {
          user: userDetails,
          caseNumber: '123',
        },
      } as unknown as AppRequest;

      const res = {} as Response;

      await controller.downloadDocument(req, res, 'doc-123', '123');

      expect(getDocumentMock).toHaveBeenCalledWith(res, 'doc-123');
    });

    test('passes correct user into getApiClient', async () => {
      const getDocumentMock = jest.fn().mockResolvedValue(undefined);

      const getApiClientMock = jest.fn().mockReturnValue({
        getDocument: getDocumentMock,
      });

      (controller as unknown as {
        getApiClient: typeof getApiClientMock;
      }).getApiClient = getApiClientMock;

      const req = {
        session: {
          user: userDetails,
          caseNumber: '456',
        },
      } as unknown as AppRequest;

      const res = {} as Response;

      await controller.downloadDocument(req, res, 'doc-456', '456');

      expect(getApiClientMock).toHaveBeenCalledWith(userDetails);
      expect(getDocumentMock).toHaveBeenCalledWith(res, 'doc-456');
    });

    test('returns 403 when caseId does not match session', async () => {
      const req = {
        session: {
          user: userDetails,
          caseNumber: '123',
        },
      } as unknown as AppRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.downloadDocument(req, res, 'doc-123', '999');

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Forbidden');
    });
  });
});