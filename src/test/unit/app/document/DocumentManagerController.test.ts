import { Response } from 'express';
import { LoggerInstance } from 'winston';

import { CaseRole, YesOrNo } from '../../../../main/app/case/definition';
import { AppRequest, UserDetails } from '../../../../main/app/controller/AppRequest';
import { ConvertedUploadedFile, DocumentConversionService } from '../../../../main/app/document/DocumentConversionService';
import { DocumentManagerController } from '../../../../main/app/document/DocumentManagerController';
import { PreviouslyUploadedDocumentClient } from '../../../../main/app/document/PreviouslyUploadedDocumentClient';
import { sendNotification } from '../../../../main/app/notify/govNotify';

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

jest.mock('../../../../main/app/document/PreviouslyUploadedDocumentClient', () => ({
  PreviouslyUploadedDocumentClient: jest.fn().mockImplementation(() => ({
    getPreviouslyUploadedDocuments: jest.fn(),
  })),
}));

jest.mock('../../../../main/app/notify/govNotify', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('config', () => ({
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      'secrets.finrem.DOCUMENT-UPLOAD-EMAIL-TEMPLATE-ID': 'test-template-id',
    };
    return values[key] ?? 'mock-config-value';
  }),
}));

jest.mock('axios', () => ({
  isAxiosError: jest.fn().mockReturnValue(false),
}));

jest.mock('../../../../main/modules/appinsights', () => ({
  AppInsights: {
    trackException: jest.fn(),
  },
}));

jest.mock('../../../../main/functions/util/homePageUtil', () => ({
  loadCaseAndReloadSession: jest.fn().mockResolvedValue({}),
}));

describe('DocumentManagerController', () => {
  let mockLogger: LoggerInstance;
  let mockDocumentConversionService: {
    convertUploadedFileToPdfIfNotPdf: jest.Mock;
    cleanupTemporaryConversionFiles: jest.Mock;
  };
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
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as LoggerInstance;

    mockDocumentConversionService = {
      convertUploadedFileToPdfIfNotPdf: jest.fn(),
      cleanupTemporaryConversionFiles: jest.fn(),
    };

    controller = new DocumentManagerController(
      mockLogger,
      mockDocumentConversionService as unknown as DocumentConversionService
    );
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

  test('stores OriginalFileName alongside DocumentFileName', async () => {
    const createMock = jest.fn().mockResolvedValue([
      {
        originalDocumentName: 'JohnSmith-BankStatements-24-06-2026.pdf',
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
          originalname: 'my-bank-statement.pdf',
        } as Express.Multer.File,
      ],
    });

    await controller.uploadDocumentToEvidenceStore(req, 'BANK_STATEMENTS' as never);

    expect(req.session.documents?.documentDetails).toHaveLength(1);
    const uploadedDoc = req.session.documents?.documentDetails?.[0].value;
    expect(uploadedDoc?.DocumentFileName).toBe('JohnSmith-BankStatements-24-06-2026.pdf');
    expect(uploadedDoc?.OriginalFileName).toBe('my-bank-statement.pdf');
  });

  test('stores original uploaded filename when file was converted to PDF', async () => {
    const createMock = jest.fn().mockResolvedValue([
      {
        originalDocumentName: 'statement.pdf',
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
          buffer: Buffer.from('converted pdf'),
          originalname: 'statement.pdf',
          originalUploadedName: 'statement.docx',
        } as ConvertedUploadedFile,
      ],
    });

    await controller.uploadDocumentToEvidenceStore(req, 'BANK_STATEMENTS' as never);

    const uploadedDoc = req.session.documents?.documentDetails?.[0].value;
    expect(uploadedDoc?.DocumentFileName).toBe('statement.pdf');
    expect(uploadedDoc?.OriginalFileName).toBe('statement.docx');
  });

  test('converts request files to PDF before upload', async () => {
    const sourceFile = {
      buffer: Buffer.from('source'),
      originalname: 'statement.xlsx',
    } as Express.Multer.File;
    const convertedFile = {
      ...sourceFile,
      buffer: Buffer.from('converted'),
      mimetype: 'application/pdf',
      originalname: 'statement.pdf',
      originalUploadedName: 'statement.xlsx',
    } as ConvertedUploadedFile;
    mockDocumentConversionService.convertUploadedFileToPdfIfNotPdf.mockResolvedValueOnce(convertedFile);

    const req = buildRequest({ files: [sourceFile] });

    await controller.convertDocumentToPdfIfNotPdf(req);

    expect(mockDocumentConversionService.convertUploadedFileToPdfIfNotPdf).toHaveBeenCalledWith(sourceFile);
    expect(req.files).toEqual([convertedFile]);
  });

  test('cleans converted files when conversion fails after a partial conversion', async () => {
    const firstSourceFile = {
      buffer: Buffer.from('source 1'),
      originalname: 'first.docx',
    } as Express.Multer.File;
    const secondSourceFile = {
      buffer: Buffer.from('source 2'),
      originalname: 'second.docx',
    } as Express.Multer.File;
    const convertedFile = {
      ...firstSourceFile,
      originalname: 'first.pdf',
      convertedFilePath: '/tmp/first.pdf',
    } as ConvertedUploadedFile;
    const conversionError = new Error('Conversion failed');

    mockDocumentConversionService.convertUploadedFileToPdfIfNotPdf
      .mockResolvedValueOnce(convertedFile)
      .mockRejectedValueOnce(conversionError);

    const req = buildRequest({ files: [firstSourceFile, secondSourceFile] });

    await expect(controller.convertDocumentToPdfIfNotPdf(req)).rejects.toThrow(conversionError);

    expect(mockDocumentConversionService.cleanupTemporaryConversionFiles).toHaveBeenCalledWith([convertedFile]);
    expect(req.files).toEqual([firstSourceFile, secondSourceFile]);
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

    expect(getCaseApi).toHaveBeenCalledWith(req.session.user, mockLogger);
    expect(triggerEventMock).toHaveBeenCalled();
    expect(req.session.documents).toBeUndefined();
  });

  test('uses the session user when creating case API client in LinkDocumentsToCase', async () => {
    jest.clearAllMocks();

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

    expect(getCaseApi).toHaveBeenCalledWith(userDetails, mockLogger);
    expect(triggerEventMock).toHaveBeenCalled();
  });

  test('calls notifyDocumentUploaded with correct data after triggerEvent', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '1234-5678-0123-4567',
        caseUserName: 'Test Applicant',
        documents: {
          documentDetails: [{ id: '1', value: {} }],
        },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(sendNotification).toHaveBeenCalledWith(
      'test-template-id',
      'test@test.com',
      expect.objectContaining({
        caseReferenceNumber: '1234-5678-0123-4567',
        name: 'Test Applicant',
      })
    );
    const triggerOrder = (triggerEventMock as jest.Mock).mock.invocationCallOrder[0];
    const notifyOrder = (sendNotification as jest.Mock).mock.invocationCallOrder[0];
    expect(triggerOrder).toBeLessThan(notifyOrder);
  });

  test('sends one confirmation email when multiple documents are uploaded in one session', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '1234-5678-0123-4567',
        caseUserName: 'Test Applicant',
        documents: {
          documentDetails: [{ id: '1', value: {} }, { id: '2', value: {} }, { id: '3', value: {} }],
        },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(triggerEventMock).toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledWith(
      'test-template-id',
      'test@test.com',
      expect.objectContaining({
        caseReferenceNumber: '1234-5678-0123-4567',
        name: 'Test Applicant',
      })
    );
  });

  test('does not call notifyDocumentUploaded when triggerEvent fails', async () => {
    const triggerEventMock = jest.fn().mockRejectedValue(new Error('CCD unavailable'));
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '1234-5678-0123-4567',
        caseUserName: 'Test Applicant',
        documents: {
          documentDetails: [{ id: '1', value: {} }],
        },
      } as unknown as AppRequest['session'],
    });

    await expect(controller.LinkDocumentsToCase(req)).rejects.toThrow('CCD unavailable');
    expect(sendNotification).not.toHaveBeenCalled();
  });

  test('logs error when notifyDocumentUploaded fails', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    jest.mocked(sendNotification).mockRejectedValueOnce(new Error('Notify failed'));

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

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error sending notification',
      expect.any(Error)
    );
  });

  test('calls AppInsights.trackException when notification fails', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    jest.mocked(sendNotification).mockRejectedValueOnce(new Error('Notify failed'));

    const { AppInsights } = require('../../../../main/modules/appinsights');

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

    expect(AppInsights.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        emailTemplateId: 'test-template-id',
        caseNumber: '123',
        email: 'test@test.com',
      })
    );
  });

  test('wraps non-Error thrown from notification into Error before tracking', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    jest.mocked(sendNotification).mockRejectedValueOnce('plain string error');

    const { AppInsights } = require('../../../../main/modules/appinsights');

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        documents: { documentDetails: [{ id: '1', value: {} }] },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(AppInsights.trackException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to send email notification for uploading the documents' }),
      expect.any(Object)
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error sending notification',
      expect.objectContaining({ message: 'Failed to send email notification for uploading the documents' })
    );
  });

  test('logs GOV Notify error with logger.error when axios error occurs', async () => {
    const axiosMock = require('axios');
    axiosMock.isAxiosError.mockReturnValueOnce(true);

    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const axiosError = { response: { status: 400, data: { message: 'bad request' } } };
    jest.mocked(sendNotification).mockRejectedValueOnce(axiosError);

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        documents: { documentDetails: [{ id: '1', value: {} }] },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'GOV Notify error',
      expect.any(String)
    );
  });

  test('does not call getSystemUser in LinkDocumentsToCase', async () => {
    jest.clearAllMocks();

    const triggerEventMock = jest.fn().mockResolvedValue({});

    const { getCaseApi } = require('../../../../main/app/case/case-api');
    const { getSystemUser } = require('../../../../main/app/auth/user');

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

    expect(getSystemUser).not.toHaveBeenCalled();
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

    test('passes system user into getApiClient', async () => {
      const systemUser = { accessToken: 'system-token' };

      const { getSystemUser } = require('../../../../main/app/auth/user');
      getSystemUser.mockResolvedValue(systemUser);

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

      expect(getApiClientMock).toHaveBeenCalledWith(systemUser);
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

  describe('previouslyUploadedDocuments', () => {
    const mockResponse = {
      case_details: {
        id: 123,
        jurisdiction: 'DIVORCE',
        state: 'prepareForHearing',
        version: 1,
        case_type_id: 'FinancialRemedyContested',
        created_date: '2025-09-01T17:59:33.096969',
        last_modified: '2026-06-15T08:11:58.318546',
        last_state_modified_date: '2026-06-15T08:09:26.395018',
        security_classification: 'PUBLIC',
        case_data: {
          citizenApplicantDocument: [],
        },
      },
      event_id: 'CUI_applicantUploadDocuments',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('throws when user is missing from session', async () => {
      const req = {
        session: { user: undefined },
      } as unknown as AppRequest;

      const res = {} as Response;

      await expect(
        controller.previouslyUploadedDocuments(req, res, '123')
      ).rejects.toThrow('No user in session');
    });

    test('returns 403 and throws when caseId does not match session', async () => {
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

      await expect(
        controller.previouslyUploadedDocuments(req, res, '999')
      ).rejects.toThrow('Forbidden');

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Forbidden');
    });

    test('uses applicant upload document event for applicant', async () => {
      const getPreviouslyUploadedDocumentsMock = jest
        .fn()
        .mockResolvedValue(mockResponse);

      (PreviouslyUploadedDocumentClient as jest.Mock).mockImplementation(() => ({
        getPreviouslyUploadedDocuments: getPreviouslyUploadedDocumentsMock,
      }));

      const req = {
        session: {
          user: {
            ...userDetails,
            caseRole: CaseRole.APPLICANT,
          },
          caseNumber: '123',
        },
      } as unknown as AppRequest;

      const res = {} as Response;

      const result = await controller.previouslyUploadedDocuments(req, res, '123');

      expect(getPreviouslyUploadedDocumentsMock).toHaveBeenCalledWith(
        '123',
        'CUI_applicantUploadDocuments'
      );
      expect(result).toBe(mockResponse);
    });

    test('uses respondent upload document event for respondent', async () => {
      const getPreviouslyUploadedDocumentsMock = jest
        .fn()
        .mockResolvedValue({
          ...mockResponse,
          event_id: 'CUI_respondentUploadDocuments',
        });

      (PreviouslyUploadedDocumentClient as jest.Mock).mockImplementation(() => ({
        getPreviouslyUploadedDocuments: getPreviouslyUploadedDocumentsMock,
      }));

      const req = {
        session: {
          user: {
            ...userDetails,
            caseRole: CaseRole.RESPONDENT,
          },
          caseNumber: '123',
        },
      } as unknown as AppRequest;

      const res = {} as Response;

      const result = await controller.previouslyUploadedDocuments(req, res, '123');

      expect(getPreviouslyUploadedDocumentsMock).toHaveBeenCalledWith(
        '123',
        'CUI_respondentUploadDocuments'
      );
      expect(result.event_id).toBe('CUI_respondentUploadDocuments');
    });

    test('logs case role', async () => {
      const getPreviouslyUploadedDocumentsMock = jest
        .fn()
        .mockResolvedValue(mockResponse);

      (PreviouslyUploadedDocumentClient as jest.Mock).mockImplementation(() => ({
        getPreviouslyUploadedDocuments: getPreviouslyUploadedDocumentsMock,
      }));

      const req = {
        session: {
          user: userDetails,
          caseNumber: '123',
        },
      } as unknown as AppRequest;

      const res = {} as Response;

      await controller.previouslyUploadedDocuments(req, res, '123');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'is Applicant or respondent',
        CaseRole.APPLICANT
      );
    });
  });
  test('throws an error when case role is unsupported', async () => {
    const req = {
      session: {
        user: {
          ...userDetails,
          caseRole: 'INVALID',
        },
        caseNumber: '123',
      },
    } as unknown as AppRequest;

    const res = {} as Response;

    await expect(
      controller.previouslyUploadedDocuments(req, res, '123')
    ).rejects.toThrow('Unsupported case role');
  });
  test('sets isFDR to NO on each uploaded case document when isFinancialDisputeResolution is false or undefined', async () => {
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
          isFinancialDisputeResolution: false,
          documentDetails: [
            { id: '1', value: { existing: 'field' } },
            { id: '2', value: { existing: 'field-2' } },
          ],
        },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(triggerEventMock).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({
        citizenApplicantDocument: [
          expect.objectContaining({
            value: expect.objectContaining({
              existing: 'field',
              isFDR: YesOrNo.NO,
            }),
          }),
          expect.objectContaining({
            value: expect.objectContaining({
              existing: 'field-2',
              isFDR: YesOrNo.NO,
            }),
          }),
        ],
      }),
      expect.any(String)
    );
  });

  test('formats courtName for In_Person hearing mode', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        caseUserName: 'Test Applicant',
        caseData: {
          consentOrderFRCName: 'Nottingham FRC',
          consentOrderFRCEmail: 'frc@justice.gov.uk',
          hearings: [{ id: '1', value: { hearingMode: 'In_Person' } }],
        },
        documents: { documentDetails: [{ id: '1', value: {} }] },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(sendNotification).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        courtName: 'Financial Remedies Court: Nottingham FRC',
        courtEmail: 'frc@justice.gov.uk',
      })
    );
  });

  test('sends empty courtName for non-In_Person hearing mode', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        caseUserName: 'Test Applicant',
        caseData: {
          consentOrderFRCName: 'Nottingham FRC',
          consentOrderFRCEmail: 'frc@justice.gov.uk',
          hearings: [{ id: '1', value: { hearingMode: 'Video_Call' } }],
        },
        documents: { documentDetails: [{ id: '1', value: {} }] },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(sendNotification).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ courtName: '', courtEmail: 'frc@justice.gov.uk' })
    );
  });

  test('sends empty strings for courtName and courtEmail when caseData fields are absent', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        documents: { documentDetails: [{ id: '1', value: {} }] },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(sendNotification).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ courtName: '', courtEmail: '' })
    );
  });

  test('refreshes caseData via loadCaseAndReloadSession after triggerEvent', async () => {
    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const { loadCaseAndReloadSession } = require('../../../../main/functions/util/homePageUtil');
    const refreshedData = { citizenApplicantDocument: [{ id: 'new' }] };
    loadCaseAndReloadSession.mockResolvedValueOnce(refreshedData);

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        documents: { documentDetails: [{ id: '1', value: {} }] },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(loadCaseAndReloadSession).toHaveBeenCalledWith(req, '123', mockLogger);
    expect(req.session.caseData).toBe(refreshedData);
  });

  test('formatUploadTime returns time in expected format', async () => {
    const fixedDate = new Date('2026-03-12T12:37:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => fixedDate as unknown as Date);

    const triggerEventMock = jest.fn().mockResolvedValue({});
    const { getCaseApi } = require('../../../../main/app/case/case-api');
    getCaseApi.mockReturnValue({ triggerEvent: triggerEventMock });

    const req = buildRequest({
      session: {
        user: userDetails,
        caseNumber: '123',
        caseUserName: 'Test',
        documents: { documentDetails: [{ id: '1', value: {} }] },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    const call = (sendNotification as jest.Mock).mock.calls[0][2];
    expect(call.uploadTime).toMatch(/^\d{1,2}:\d{2}(am|pm) on \d{2}\/\d{2}\/\d{4}$/);

    jest.restoreAllMocks();
  });

  test('sets isFDR to YES on each uploaded case document when isFinancialDisputeResolution is true', async () => {
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
          isFinancialDisputeResolution: true,
          documentDetails: [
            { id: '1', value: { existing: 'field' } },
            { id: '2', value: { existing: 'field-2' } },
          ],
        },
      } as unknown as AppRequest['session'],
    });

    await controller.LinkDocumentsToCase(req);

    expect(triggerEventMock).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({
        citizenApplicantDocument: [
          expect.objectContaining({
            value: expect.objectContaining({
              existing: 'field',
              isFDR: YesOrNo.YES,
            }),
          }),
          expect.objectContaining({
            value: expect.objectContaining({
              existing: 'field-2',
              isFDR: YesOrNo.YES,
            }),
          }),
        ],
      }),
      expect.any(String)
    );
  });
});
