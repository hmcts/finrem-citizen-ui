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

  const buildRequest = (
    overrides: Partial<AppRequest> = {}
  ): AppRequest =>
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

  test('stores documents in session', async () => {
    const createMock = jest.fn().mockResolvedValue([
      {
        originalDocumentName: 'file.pdf',
        _links: {
          self: { href: '/doc/1' },
          binary: { href: '/doc/1/bin' },
        },
      },
    ]);

    jest
      .spyOn(
        controller as unknown as { getApiClient: (user: UserDetails) => { create: typeof createMock } },
        'getApiClient'
      )
      .mockReturnValue({ create: createMock });

    const req = buildRequest({
      files: [
        {
          buffer: Buffer.from('file'),
          originalname: 'file.pdf',
        } as Express.Multer.File,
      ],
    });

    await controller.uploadDocumentToEvidenceStore(req, 'BANK_STATEMENTS' as never);

  test('should throw error when user is missing from session', async () => {
    const req = buildRequest({
      session: { user: undefined } as AppRequest['session'],
      files: [
        {
          buffer: Buffer.from('file'),
          originalname: 'file1.pdf',
        } as Express.Multer.File,
      ],
    });

    await expect(controller.post(req, mockResponse()))
      .rejects.toThrow('No user in session');
  });

  test('should upload files and log success', async () => {
    expect(req.session.documents?.documentDetails).toHaveLength(1);
    expect(req.session.documents?.documentDetails?.[0].id).toBe('mock-uuid');
  });

  test('appends documents to existing collection', async () => {
    const createMock = jest.fn().mockResolvedValue([
      {
        originalDocumentName: 'file2.pdf',
        _links: {
          self: { href: '/doc/2' },
          binary: { href: '/doc/2/bin' },
        },
      },
    ]);

    jest
      .spyOn(
        controller as unknown as { getApiClient: (user: UserDetails) => { create: typeof createMock } },
        'getApiClient'
      )
      .mockReturnValue({ create: createMock });

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
    expect(req.session.uploadedDocuments).toEqual([
      'https://doc-store/documents/1/binary',
      'https://doc-store/documents/2/binary',
    ]);

    await expect(controller.LinkDocumentsToCase(req)).rejects.toThrow(
      'No documents in session to send'
    );
  });

  test('triggers event and clears session', async () => {
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
});
