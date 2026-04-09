import axios, { AxiosInstance } from 'axios';
import { LoggerInstance } from 'winston';

import { CaseApiClient, getCaseApiClient } from '../../../../main/app/case/case-api-client';
import { CaseAssignedUserRole } from '../../../../main/app/case/case-roles';
import { CaseRole } from '../../../../main/app/case/definition';
import { UserDetails } from '../../../../main/app/controller/AppRequest';

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

describe('CaseApiClient.findExistingUserCases', () => {
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

  const CASE_TYPE = 'FinancialRemedyContested';

  test('should return cases when search is successful', async () => {
    const cases = [{ id: '1', state: 'Draft', case_data: {} }];

    mockAxios.post.mockResolvedValue({
      data: { cases, total: 1 },
    });

    const result = await api.findExistingUserCases(CASE_TYPE);

    expect(mockAxios.post).toHaveBeenCalledWith(
      `/searchCases?ctid=${CASE_TYPE}`,
      expect.any(String)
    );
    expect(result).toEqual(cases);
  });

  test('should return false when 404 is returned', async () => {
    mockAxios.post.mockRejectedValue({
      response: { status: 404 },
    });

    const result = await api.findExistingUserCases(CASE_TYPE);

    expect(result).toBe(false);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('should log error and throw when error occurs', async () => {
    mockAxios.post.mockRejectedValue({
      config: { method: 'post', url: `/searchCases?ctid=${CASE_TYPE}` },
      response: { status: 500, data: { error: 'bad' } },
    });

    await expect(api.findExistingUserCases(CASE_TYPE))
      .rejects.toThrow('Case could not be retrieved.');

    expect(mockLogger.error).toHaveBeenCalledWith(
      `API Error post /searchCases?ctid=${CASE_TYPE} 500`
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Response: ',
      { error: 'bad' }
    );
  });
});

describe('CaseApiClient.getCaseUserRoles', () => {
  let mockAxios: jest.Mocked<Pick<typeof axios, 'post'>>;
  let mockLogger: LoggerInstance;
  let api: CaseApiClient;

  beforeEach(() => {
    mockAxios = {
      post: jest.fn(),
    } as unknown as jest.Mocked<Pick<typeof axios, 'post'>>;

    mockLogger = {
      error: jest.fn().mockImplementation((msg: string) => msg),
      info: jest.fn().mockImplementation((msg: string) => msg),
    } as unknown as LoggerInstance;

    api = new CaseApiClient(mockAxios as unknown as AxiosInstance, mockLogger);
  });

  test('should POST search request and return case user roles', async () => {
    const request = {
      case_ids: ['1234'],
      user_ids: ['user1'],
    };

    const responseData = {
      case_users: [
        {
          case_id: '1234',
          user_id: 'user1',
          case_role: CaseRole.APPLICANT,
        },
      ],
    };

    mockAxios.post.mockResolvedValue({
      data: responseData,
    });

    const result = await api.getCaseUserRoles(request);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'case-users/search',
      request
    );
    expect(result).toEqual(responseData);
  });

  test('should log error and throw when API call fails', async () => {
    const request = {
      case_ids: ['1234'],
      user_ids: ['user1'],
    };

    const axiosError = {
      config: { method: 'post', url: 'case-users/search' },
      response: {
        status: 500,
        data: { error: 'Internal error' },
      },
    };

    mockAxios.post.mockRejectedValue(axiosError);

    await expect(api.getCaseUserRoles(request))
      .rejects
      .toThrow('Case roles could not be fetched.');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'API Error post case-users/search 500'
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Response: ',
      { error: 'Internal error' }
    );
  });
});

