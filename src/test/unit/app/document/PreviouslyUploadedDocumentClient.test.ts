import axios from 'axios';
import config from 'config';

import { getServiceAuthToken } from '../../../../main/app/auth/service/get-service-auth-token';
import { CASE_DATA_API_URL } from '../../../../main/app/case/case-type';
import type { UserDetails } from '../../../../main/app/controller/AppRequest';
import { PreviouslyUploadedDocumentClient } from '../../../../main/app/document/PreviouslyUploadedDocumentClient';
import { UrlEndPoints } from '../../../../main/common-constants';

jest.mock('axios');
jest.mock('config');
jest.mock('../../../../main/app/auth/service/get-service-auth-token');
jest.mock('../../../../main/common-constants', () => ({
  UrlEndPoints: {
    PreviouslyUploadedDocuments: jest.fn(),
  },
}));

describe('PreviouslyUploadedDocumentClient', () => {
  const mockGet = jest.fn();

  const user = {
    accessToken: 'user-access-token',
  } as UserDetails;

  const baseUrl = 'http://case-data-api.test';
  const serviceAuthToken = 'service-auth-token';

  beforeEach(() => {
    jest.clearAllMocks();

    (config.get as jest.Mock).mockReturnValue(baseUrl);
    (getServiceAuthToken as jest.Mock).mockReturnValue(serviceAuthToken);

    (axios.create as jest.Mock).mockReturnValue({
      get: mockGet,
    });
  });

  it('creates an axios client with base url and required headers', () => {
    new PreviouslyUploadedDocumentClient(user);

    expect(config.get).toHaveBeenCalledWith(CASE_DATA_API_URL);
    expect(getServiceAuthToken).toHaveBeenCalled();

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: baseUrl,
      headers: {
        Authorization: 'Bearer user-access-token',
        ServiceAuthorization: serviceAuthToken,
        experimental: 'true',
      },
    });
  });

  it('gets previously uploaded documents and returns response data', async () => {
    const caseId = '12345';
    const documentCollection = 'citizenApplicantDocument';
    const endpoint = `/cases/${caseId}/documents/${documentCollection}`;

    const responseData = {
      event_id: 'event-123',
      case_details: {
        id: 1,
        jurisdiction: 'DIVORCE',
        state: 'Submitted',
        version: 1,
        case_type_id: 'A58',
        created_date: '2024-01-01',
        last_modified: '2024-01-02',
        last_state_modified_date: '2024-01-03',
        security_classification: 'PUBLIC',
        case_data: {
          citizenApplicantDocument: [
            {
              id: 'doc-1',
              value: {
                DocumentType: 'application',
                DocumentFileName: 'test.pdf',
                DocumentLink: {
                  document_url: 'http://doc-url',
                  upload_timestamp: '2024-01-01T10:00:00',
                  document_filename: 'test.pdf',
                  document_binary_url: 'http://binary-url',
                },
              },
            },
          ],
        },
      },
    };

    (UrlEndPoints.PreviouslyUploadedDocuments as jest.Mock).mockReturnValue(endpoint);
    mockGet.mockResolvedValue({ data: responseData });

    const client = new PreviouslyUploadedDocumentClient(user);

    const result = await client.getPreviouslyUploadedDocuments(
      caseId,
      documentCollection
    );

    expect(UrlEndPoints.PreviouslyUploadedDocuments).toHaveBeenCalledWith(
      caseId,
      documentCollection
    );

    expect(mockGet).toHaveBeenCalledWith(endpoint);
    expect(result).toEqual(responseData);
  });

  it('throws when axios get rejects', async () => {
    const caseId = '12345';
    const documentCollection = 'citizenRespondentDocument';
    const endpoint = '/test-endpoint';
    const error = new Error('Request failed');

    (UrlEndPoints.PreviouslyUploadedDocuments as jest.Mock).mockReturnValue(endpoint);
    mockGet.mockRejectedValue(error);

    const client = new PreviouslyUploadedDocumentClient(user);

    await expect(
      client.getPreviouslyUploadedDocuments(caseId, documentCollection)
    ).rejects.toThrow('Request failed');

    expect(mockGet).toHaveBeenCalledWith(endpoint);
  });
});
