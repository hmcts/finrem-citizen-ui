import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { LoggerInstance } from 'winston';

import { UserDetails } from '../controller/AppRequest';

import { CaseApiClient, getCaseApiClient } from './case-api-client';
import { CaseAssignedUserRole } from './case-roles';
import { CaseRole } from './definition';

jest.mock('axios');

const userDetails: UserDetails = {
  accessToken: '123',
  idToken: '',
  refreshToken: undefined,
  sub: '',
  email: 'billy@bob.com',
  givenName: 'billy',
  familyName: 'bob',
  id: 'something',
  roles: ['something'],
};

describe('CaseApi', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  let mockLogger = {
    error: jest.fn().mockImplementation((message: string) => message),
    info: jest.fn().mockImplementation((message: string) => message),
  } as unknown as LoggerInstance;

  let api: CaseApiClient;
  beforeEach(() => {
    mockLogger = {
      error: jest.fn().mockImplementation((message: string) => message),
      info: jest.fn().mockImplementation((message: string) => message),
    } as unknown as LoggerInstance;

    api = new CaseApiClient(mockedAxios, mockLogger);
  });

  test('Should return case for caseId passed', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        data: {
          id: '1234',
          accessCode: 'NFSDCLV3',
        },
      },
    });

    const userCase = await api.getCaseById('1234');
    expect(userCase).toStrictEqual({ id: '1234', accessCode: 'NFSDCLV3' });
  });

  test('Should throw error when case could not be fetched', async () => {
    mockedAxios.get.mockRejectedValue({
      config: { method: 'GET', url: 'https://example.com' },
      request: 'mock request',
    });

    await expect(api.getCaseById('1234')).rejects.toThrow('Case could not be retrieved.');

    expect(mockLogger.error).toHaveBeenCalledWith('API Error GET https://example.com');
  });

  test('Should catch all errors', async () => {
    mockedAxios.get.mockRejectedValue({
      message: 'Error',
    });

    await expect(api.getCaseById('1234')).rejects.toThrow('Case could not be retrieved.');

    expect(mockLogger.error).toHaveBeenCalledWith('API Error', 'Error');
  });
});

describe('getCaseApiClient', () => {
  test('should create a CaseApiClient', () => {
    expect(getCaseApiClient(userDetails, {} as never)).toBeInstanceOf(CaseApiClient);
  });
});

describe('CaseApi.addCaseUserRoles', () => {
  let mockAxios: jest.Mocked<Pick<typeof axios, 'post' | 'get'>>;
  let mockLogger: LoggerInstance;
  let api: CaseApiClient;

  beforeEach(() => {
    mockAxios = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<Pick<typeof axios, 'post' | 'get'>>;

    mockLogger = {
      error: jest.fn().mockImplementation((msg: string) => msg),
      info: jest.fn().mockImplementation((msg: string) => msg),
    } as unknown as LoggerInstance;

    api = new CaseApiClient(mockAxios as unknown as AxiosInstance, mockLogger);
  });

  test('should POST assignments to /case-users successfully', async () => {
    const assignments: CaseAssignedUserRole[] = [
      {
        case_id: '123',
        user_id: 'user1',
        case_role: CaseRole.RESPONDENT,
      },
    ];

    mockAxios.post.mockResolvedValue({ status: 200 });

    await expect(api.addCaseUserRoles(assignments)).resolves.not.toThrow();

    expect(mockAxios.post).toHaveBeenCalledWith('/case-users', {
      case_users: assignments,
    });
  });

  test('should log error + response and throw when API returns error.response', async () => {
    const assignments: CaseAssignedUserRole[] = [
      {
        case_id: '123',
        user_id: 'user1',
        case_role: CaseRole.APPLICANT,
      },
    ];

    const axiosError = {
      isAxiosError: true,
      message: 'Boom',
      config: { method: 'post', url: '/case-users' },
      response: {
        status: 500,
        data: { error: 'Internal error' },
      },
    };

    mockAxios.post.mockRejectedValue(axiosError);

    await expect(api.addCaseUserRoles(assignments)).rejects.toThrow('Case user roles could not be added.');

    expect(mockLogger.error).toHaveBeenCalledWith('API Error post /case-users 500');

    expect(mockLogger.info).toHaveBeenCalledWith('Response: ', {
      error: 'Internal error',
    });
  });
});
