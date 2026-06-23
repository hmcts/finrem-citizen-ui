import axios, { AxiosInstance } from 'axios';
import { LoggerInstance } from 'winston';

import { CaseApiClient, getCaseApiClient } from '../../../../main/app/case/case-api-client';
import { CaseAssignedUserRole } from '../../../../main/app/case/case-roles';
import { EVENT_TYPE } from '../../../../main/app/case/case-type';
import { CaseRole, YesOrNo } from '../../../../main/app/case/definition';
import { UserDetails } from '../../../../main/app/controller/AppRequest';
import { UrlEndPoints } from '../../../../main/common-constants';
import { AppInsights } from '../../../../main/modules/appinsights';

jest.mock('axios');
jest.mock('../../../../main/modules/appinsights');

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
  const mockedAppInsights = AppInsights as jest.Mocked<typeof AppInsights>;

  let mockLogger = {
    error: jest.fn().mockImplementation((message: string) => message),
    info: jest.fn().mockImplementation((message: string) => message),
  } as unknown as LoggerInstance;

  let api: CaseApiClient;
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(mockedAppInsights.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'getCaseById',
        caseId: '1234',
      })
    );
  });

  test('Should catch all errors', async () => {
    mockedAxios.get.mockRejectedValue({
      message: 'Error',
    });

    await expect(api.getCaseById('1234')).rejects.toThrow('Case could not be retrieved.');

    expect(mockLogger.error).toHaveBeenCalledWith('API Error', 'Error');
    expect(mockedAppInsights.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'getCaseById',
        caseId: '1234',
      })
    );
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
  const mockedAppInsights = AppInsights as jest.Mocked<typeof AppInsights>;

  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(mockedAppInsights.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'addCaseUserRoles',
        endpoint: UrlEndPoints.CaseUsers,
        statusCode: '500',
      })
    );
  });
});

describe('CaseApiClient.findExistingUserCases', () => {
  let mockAxios: jest.Mocked<Pick<typeof axios, 'post' | 'get'>>;
  let mockLogger: LoggerInstance;
  let api: CaseApiClient;
  const mockedAppInsights = AppInsights as jest.Mocked<typeof AppInsights>;

  beforeEach(() => {
    jest.clearAllMocks();
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
      UrlEndPoints.SearchCases(CASE_TYPE),
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
      config: { method: 'post', url: UrlEndPoints.SearchCases(CASE_TYPE) },
      response: { status: 500, data: { error: 'bad' } },
    });

    await expect(api.findExistingUserCases(CASE_TYPE))
      .rejects.toThrow('Case could not be retrieved.');

    expect(mockLogger.error).toHaveBeenCalledWith(
      `API Error post ${UrlEndPoints.SearchCases(CASE_TYPE)} 500`
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Response: ',
      { error: 'bad' }
    );

    expect(mockedAppInsights.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'findExistingUserCases',
        caseType: CASE_TYPE,
        statusCode: '500',
      })
    );
  });
});

describe('CaseApiClient.sendEvent', () => {
  let mockAxios: jest.Mocked<Pick<typeof axios, 'get' | 'post'>>;
  let mockLogger: LoggerInstance;
  let api: CaseApiClient;
  const mockedAppInsights = AppInsights as jest.Mocked<typeof AppInsights>;

  const CASE_ID = '123456';
  const EVENT_NAME = EVENT_TYPE.INVALIDATE_APPLICANT_ACCESS_CODE;

  
const applicantAccessCodes = [
  {
    id: '9319d817-ade5-4e9e-a204-261331158a0e',
    value: {
      isValid: YesOrNo.NO,
      createdAt: '2026-04-24T13:17:07.061694',
      accessCode: 'FBLV2NTR',
      validUntil: '2026-07-23T13:17:07.061701',
    },
  },
];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as jest.Mocked<Pick<typeof axios, 'get' | 'post'>>;

    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    } as unknown as LoggerInstance;

    api = new CaseApiClient(mockAxios as unknown as AxiosInstance, mockLogger);
  });

  test('should send event successfully and return updated case data', async () => {
    mockAxios.get.mockResolvedValue({
      data: { token: 'event-token' },
    });

    mockAxios.post.mockResolvedValue({
      data: {
        id: CASE_ID,
        state: 'Submitted',
        data: {
          applicantAccessCodes,
        },
      },
    });

    const result = await api.sendEvent(
      CASE_ID,
      { applicantAccessCodes },
      EVENT_NAME
    );

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      UrlEndPoints.CaseEventTrigger(CASE_ID, EVENT_NAME)
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      UrlEndPoints.CaseEvents(CASE_ID),
      {
        event: { id: EVENT_NAME },
        data: { applicantAccessCodes },
        event_token: 'event-token',
      }
    );

    expect(result).toEqual({
      id: CASE_ID,
      state: 'Submitted',
      applicantAccessCodes,
    });
  });

  test('should retry once for retriable error and then succeed', async () => {
    mockAxios.get.mockResolvedValue({
      data: { token: 'event-token' },
    });

    mockAxios.post
      .mockRejectedValueOnce({
        response: { status: 409 },
      })
      .mockResolvedValueOnce({
        data: {
          id: CASE_ID,
          state: 'Updated',
          data: {
            applicantAccessCodes,
          },
        },
      });

    const result = await api.sendEvent(
      CASE_ID,
      { applicantAccessCodes },
      EVENT_NAME
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'retrying send event due to 409. this is retry no (1)'
    );

    expect(mockAxios.get).toHaveBeenCalledTimes(2);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);

    expect(result).toEqual({
      id: CASE_ID,
      state: 'Updated',
      applicantAccessCodes,
    });
  });

  test('should throw immediately for non-retriable error', async () => {
    mockAxios.get.mockResolvedValue({
      data: { token: 'event-token' },
    });

    mockAxios.post.mockRejectedValue({
      config: { method: 'post', url: UrlEndPoints.CaseEvents(CASE_ID) },
      response: {
        status: 400,
        data: { error: 'bad request' },
      },
    });

    await expect(
      api.sendEvent(CASE_ID, { applicantAccessCodes }, EVENT_NAME)
    ).rejects.toThrow('Case could not be updated.');

    expect(mockLogger.error).toHaveBeenCalledWith(
      `API Error post ${UrlEndPoints.CaseEvents(CASE_ID)} 400`
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Response: ',
      { error: 'bad request' }
    );

    expect(mockedAppInsights.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'sendEvent',
        caseId: CASE_ID,
        eventName: EVENT_NAME,
        statusCode: '400',
      })
    );
  });
});

describe('CaseApiClient.getCaseUserRoles', () => {
  let mockAxios: jest.Mocked<Pick<typeof axios, 'post'>>;
  let mockLogger: LoggerInstance;
  let api: CaseApiClient;
  const mockedAppInsights = AppInsights as jest.Mocked<typeof AppInsights>;

  beforeEach(() => {
    jest.clearAllMocks();
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
      '/case-users/search',
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

    expect(mockedAppInsights.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'getCaseUserRoles',
        endpoint: UrlEndPoints.CaseRoles,
        statusCode: '500',
      })
    );
  });
});