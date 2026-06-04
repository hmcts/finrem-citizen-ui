import axios, { AxiosInstance } from 'axios';
import { Response } from 'express';
import FormData from 'form-data';
import { Readable } from 'stream';

import { UserDetails } from '../../../../main/app/controller/AppRequest';
import {
  CaseDocumentManagementClient,
  Classification,
} from '../../../../main/app/document/CaseDocumentManagementClient';

jest.mock('axios');
jest.mock('config', () => ({
  get: jest.fn().mockReturnValue('http://cdam'),
}));
jest.mock('../../../../main/app/auth/service/get-service-auth-token', () => ({
  getServiceAuthToken: jest.fn().mockReturnValue('service-token'),
}));

describe('CaseDocumentManagementClient', () => {
  let mockAxios: jest.Mocked<
    Pick<AxiosInstance, 'post' | 'delete' | 'get'>
  >;
  let client: CaseDocumentManagementClient;

  const userDetails: UserDetails = {
    accessToken: 'access-token',
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
    mockAxios = {
      post: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    };

    (axios.create as jest.Mock).mockReturnValue(mockAxios);

    client = new CaseDocumentManagementClient(userDetails);
  });

  test('posts documents and returns created documents', async () => {
    mockAxios.post.mockResolvedValue({
      data: {
        documents: [
          {
            originalDocumentName: 'file.pdf',
            size: 100,
            mimeType: 'application/pdf',
            createdOn: '2024-01-01',
            modifiedOn: '2024-01-01',
            classification: Classification.Public,
            _links: {
              self: { href: '/documents/1' },
              binary: { href: '/documents/1/binary' },
              thumbnail: { href: '/documents/1/thumb' },
            },
          },
        ],
      },
    });

    const files: Express.Multer.File[] = [
      {
        fieldname: 'files',
        originalname: 'file.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('file'),
        stream: Readable.from([]),
        destination: '',
        filename: '',
        path: '',
      },
    ];

    const result = await client.create({
      files,
      classification: Classification.Public,
    });

    expect(mockAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.any(Object),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );

    expect(result).toHaveLength(1);
    expect(result[0].originalDocumentName).toBe('file.pdf');
  });

  test('returns empty array when no documents returned', async () => {
    mockAxios.post.mockResolvedValue({ data: {} });

    const result = await client.create({
      files: [],
      classification: Classification.Private,
    });

    expect(result).toEqual([]);
  });

  test('uploads multiple files', async () => {
    mockAxios.post.mockResolvedValue({
      data: {
        documents: [
          { originalDocumentName: 'file1.pdf', _links: {} },
          { originalDocumentName: 'file2.pdf', _links: {} },
        ],
      },
    });

    const files: Express.Multer.File[] = [
      {
        fieldname: 'files',
        originalname: 'file1.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1,
        buffer: Buffer.from('a'),
        stream: Readable.from([]),
        destination: '',
        filename: '',
        path: '',
      },
      {
        fieldname: 'files',
        originalname: 'file2.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1,
        buffer: Buffer.from('b'),
        stream: Readable.from([]),
        destination: '',
        filename: '',
        path: '',
      },
    ];

    const result = await client.create({
      files,
      classification: Classification.Public,
    });

    expect(result).toHaveLength(2);
  });

  test('gets document, sets headers and pipes response', async () => {
    const mockPipe = jest.fn();

    mockAxios.get.mockResolvedValue({
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="file.pdf"',
      },
      data: {
        pipe: mockPipe,
      },
    });

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    await client.getDocument(res, '123');

    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      { responseType: 'stream' }
    );

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf'
    );

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="file.pdf"'
    );

    expect(mockPipe).toHaveBeenCalledWith(res);
  });

  test('uses default content-type if missing', async () => {
    const mockPipe = jest.fn();

    mockAxios.get.mockResolvedValue({
      headers: {
        'content-type': undefined,
        'content-disposition': 'attachment; filename="file.pdf"',
      },
      data: {
        pipe: mockPipe,
      },
    });

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    await client.getDocument(res, '123');

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/octet-stream'
    );
  });

  test('does not set Content-Disposition if missing', async () => {
    const mockPipe = jest.fn();

    mockAxios.get.mockResolvedValue({
      headers: {
        'content-type': 'application/pdf',
      },
      data: {
        pipe: mockPipe,
      },
    });

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    await client.getDocument(res, '123');

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf'
    );

    expect(res.setHeader).not.toHaveBeenCalledWith(
      'Content-Disposition',
      expect.anything()
    );

    expect(mockPipe).toHaveBeenCalledWith(res);
  });
});