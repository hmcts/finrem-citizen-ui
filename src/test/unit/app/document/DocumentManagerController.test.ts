import { LoggerInstance } from 'winston';

import { getCaseApi } from '../../../../main/app/case/case-api';
import { EVENT_TYPE } from '../../../../main/app/case/case-type';
import { CaseRole } from '../../../../main/app/case/definition';
import { AppRequest, UserDetails } from '../../../../main/app/controller/AppRequest';
import { DocumentManagerController } from '../../../../main/app/document/DocumentManagerController';

jest.mock('../../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../../main/app/case/case-api', () => ({
  getCaseApi: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('DocumentManagerController', () => {
  let mockLogger: LoggerInstance;
  let controller: DocumentManagerController;
  let triggerEventMock: jest.Mock;

  const mockGetCaseApi = getCaseApi as jest.MockedFunction<typeof getCaseApi>;

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
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerInstance;

    triggerEventMock = jest.fn().mockResolvedValue({});
    mockGetCaseApi.mockReturnValue({
      triggerEvent: triggerEventMock,
    } as never);

    controller = new DocumentManagerController(mockLogger);
  });

  const buildRequest = (overrides: Partial<AppRequest> = {}): AppRequest => {
    const baseSession = {
      user: userDetails,
    } as unknown as AppRequest['session'];

    return {
      session: {
        ...baseSession,
        ...(overrides.session ?? {}),
      },
      headers: {},
      files: [],
      ...overrides,
    } as AppRequest;
  };

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

    await expect(controller.LinkDocumentsToCase(req)).rejects.toThrow(
      'No documents in session to send'
    );
  });

  test('triggers applicant upload event with citizenApplicantDocument and clears session', async () => {
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

    expect(triggerEventMock).toHaveBeenCalledWith(
      '123',
      {
        citizenApplicantDocument: [{ id: '1', value: {} }],
      },
      EVENT_TYPE.APPLICANT_UPLOAD_DOCUMENT
    );
    expect(req.session.documents).toBeUndefined();
  });

  test('triggers respondent upload event with citizenRespondentDocument', async () => {
    const respondentUser = {
      ...userDetails,
      caseRole: CaseRole.RESPONDENT,
    };

    const req = buildRequest({
      session: {
        user: respondentUser,
        caseNumber: '456',
        documents: {
          documentDetails: [{ id: '2', value: {} }],
        },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(triggerEventMock).toHaveBeenCalledWith(
      '456',
      {
        citizenRespondentDocument: [{ id: '2', value: {} }],
      },
      EVENT_TYPE.RESPONDENT_UPLOAD_DOCUMENT
    );
  });
});