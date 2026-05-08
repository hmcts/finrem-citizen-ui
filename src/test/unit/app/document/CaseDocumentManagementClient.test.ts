import axios, { AxiosInstance } from 'axios';
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
  let mockAxios: jest.Mocked<Pick<AxiosInstance, 'post' | 'delete'>>;
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
    };

    (axios.create as jest.Mock).mockReturnValue(mockAxios);

    client = new CaseDocumentManagementClient(userDetails);
  });

  test('should POST documents to CDAM and return created documents', async () => {
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
      '/cases/documents',
      expect.any(FormData),
      expect.objectContaining({
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );

    expect(result).toHaveLength(1);
    expect(result[0].originalDocumentName).toBe('file.pdf');
  });

  test('should return empty array when no documents are returned', async () => {
    mockAxios.post.mockResolvedValue({ data: {} });

    const result = await client.create({
      files: [],
      classification: Classification.Private,
    });

    expect(result).toEqual([]);
  });
});
