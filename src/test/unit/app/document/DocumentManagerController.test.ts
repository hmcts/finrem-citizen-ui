import { Response } from 'express';
import { LoggerInstance } from 'winston';

import { AppRequest, UserDetails } from '../../../../main/app/controller/AppRequest';
import { Classification } from '../../../../main/app/document/CaseDocumentManagementClient';
import { DocumentManagerController } from '../../../../main/app/document/DocumentManagerController';

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

  const mockResponse = (): Response =>
  ({
    redirect: jest.fn(),
  } as unknown as Response);

  test('should throw error when no files are uploaded', async () => {
    const req = buildRequest({ files: [] });

    await expect(controller.post(req, mockResponse()))
      .rejects.toThrow('No files were uploaded');

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Uploading document via CDAM'
    );
  });

  test('should throw error when accept header contains application/json', async () => {
    const req = buildRequest({
      files: [
        {
          buffer: Buffer.from('file'),
        } as Express.Multer.File,
      ],
      headers: { accept: 'application/json' },
    });

    await expect(controller.post(req, mockResponse()))
      .rejects.toThrow('No files were uploaded');
  });

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

    const createMock = jest.fn().mockResolvedValue([
      {
        originalDocumentName: 'file1.pdf',
        _links: {
          binary: { href: 'https://doc-store/documents/1/binary' },
        },
      },
      {
        originalDocumentName: 'file2.pdf',
        _links: {
          binary: { href: 'https://doc-store/documents/2/binary' },
        },
      },
    ]);


    jest
      .spyOn(
        Object.getPrototypeOf(controller) as {
          getApiClient: (user: UserDetails) => {
            create: typeof createMock;
          };
        },
        'getApiClient'
      )
      .mockReturnValue({ create: createMock });

    const req = buildRequest({
      files: [
        {
          buffer: Buffer.from('file'),
          originalname: 'file1.pdf',
        } as Express.Multer.File,
      ],
    });

    await controller.post(req, mockResponse());

    expect(createMock).toHaveBeenCalledWith({
      files: req.files,
      classification: Classification.Public,
    });
    expect(req.session.uploadedDocuments).toEqual([
      'https://doc-store/documents/1/binary',
      'https://doc-store/documents/2/binary',
    ]);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Document upload successful',
      { filesCreated: 2 }
    );
  });
});
