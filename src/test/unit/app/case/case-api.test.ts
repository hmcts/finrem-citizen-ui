import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../../../main/app/auth/user';
import * as caseApiModule from '../../../../main/app/case/case-api';
import { CaseApi, getCaseApi, triggerSystemEvent } from '../../../../main/app/case/case-api';
import * as caseApiClient from '../../../../main/app/case/case-api-client';
import { EVENT_TYPE } from '../../../../main/app/case/case-type';
import { CaseRole, CaseType } from '../../../../main/app/case/definition';
import { UserDetails } from '../../../../main/app/controller/AppRequest';

jest.mock('axios');
jest.mock('../../../../main/app/auth/service/get-service-auth-token', () => ({
  getServiceAuthToken: jest.fn().mockReturnValue('service-token'),
}));

jest.mock('../../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn(),
}));

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
  const mockApiClient = {
    getCaseById: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn().mockImplementation((msg: string) => msg),
    info: jest.fn().mockImplementation((msg: string) => msg),
  } as unknown as LoggerInstance;

  let api: CaseApi;
  beforeEach(() => {
    api = new CaseApi(
      mockApiClient as unknown as caseApiClient.CaseApiClient,
      mockLogger as unknown as LoggerInstance
    );
  });

  afterEach(() => {
    mockApiClient.getCaseById.mockClear();
  });

  test('Should return case for caseId passed', async () => {
    const expectedCase = { id: '1234', state: 'Draft', accessCode: 'NFSDCLV3' };
    mockApiClient.getCaseById.mockResolvedValue(expectedCase);

    const actualCase = await api.getCaseById('1234');
    expect(actualCase).toStrictEqual(expectedCase);
  });

  test('Should throw error when case could not be fetched', async () => {
    mockApiClient.getCaseById.mockRejectedValue(new Error('Case could not be retrieved.'));

    await expect(api.getCaseById('1234')).rejects.toThrow('Case could not be retrieved.');
  });
});

describe('getCaseApi', () => {
  test('should create a CaseApi', () => {
    expect(getCaseApi(userDetails, {} as never)).toBeInstanceOf(CaseApi);
  });
});

test('Should call addCaseUserRoles with assignments', async () => {
  const mockApiClient = {
    getCaseById: jest.fn(),
    addCaseUserRoles: jest.fn(),
  };
  const mockLogger = {
    error: jest.fn().mockImplementation((msg: string) => msg),
    info: jest.fn().mockImplementation((msg: string) => msg),
  } as unknown as LoggerInstance;

  const api = new CaseApi(mockApiClient as unknown as caseApiClient.CaseApiClient, mockLogger as unknown as LoggerInstance);

  const assignments = [{ case_id: '1234', user_id: 'user1', case_role: CaseRole.APPLICANT }];

  mockApiClient.addCaseUserRoles.mockResolvedValue(undefined);

  await api.addUsersToCase(assignments);

  expect(mockApiClient.addCaseUserRoles).toHaveBeenCalledTimes(1);
  expect(mockApiClient.addCaseUserRoles).toHaveBeenCalledWith(assignments);
});

describe('CaseApi.getExistingFRUserCase', () => {
  const mockApiClient = {
    findUserCases: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn().mockImplementation((msg: string) => msg),
    info: jest.fn().mockImplementation((msg: string) => msg),
  } as unknown as LoggerInstance;

  let api: CaseApi;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new CaseApi(
      mockApiClient as unknown as caseApiClient.CaseApiClient,
      mockLogger as unknown as LoggerInstance
    );
  });

  test('returns undefined when user has no FR cases', async () => {
    mockApiClient.findUserCases.mockResolvedValue([]);

    const result = await api.getExistingFRUserCase();

    expect(mockApiClient.findUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findUserCases).toHaveBeenCalledWith(
      CaseType.CONTESTED,
      expect.any(String)
    );

    const query = mockApiClient.findUserCases.mock.calls[0][1] as string;
    expect(JSON.parse(query)).toEqual({
      query: { match_all: {} },
      size: 2,
    });

    expect(result).toBeUndefined();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('returns case id as string when exactly one FR case exists', async () => {
    mockApiClient.findUserCases.mockResolvedValue([
      { id: 987654321, state: 'Submitted' },
    ]);

    const result = await api.getExistingFRUserCase();

    expect(result).toBe('987654321');
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('logs error and throws when more than one FR case exists', async () => {
    mockApiClient.findUserCases.mockResolvedValue([
      { id: '1111', state: 'Draft' },
      { id: '2222', state: 'Submitted' },
    ]);

    await expect(api.getExistingFRUserCase()).rejects.toThrow(
      'More than one case found for caseType FR. Expected exactly one. Found: 2.'
    );

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'More than one case found for caseType FR. Expected exactly one. Found: 2.'
    );
  });

  test('propagates errors from apiClient.findUserCases', async () => {
    mockApiClient.findUserCases.mockRejectedValue(new Error('upstream error'));

    await expect(api.getExistingFRUserCase()).rejects.toThrow('upstream error');
    expect(mockLogger.error).not.toHaveBeenCalled();
  });
});

describe('CaseApi.triggerEvent', () => {
  const mockApiClient = {
    sendEvent: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
  } as unknown as LoggerInstance;

  let api: CaseApi;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new CaseApi(
      mockApiClient as unknown as caseApiClient.CaseApiClient,
      mockLogger
    );
  });

  test('should call apiClient.sendEvent and return the result', async () => {
    const caseId = '123456';
    const eventName = EVENT_TYPE.LINK_APPLICANT_TO_CASE;

    const userData = {
      applicantAccessCodes: [],
    };

    const expectedResult = {
      id: caseId,
      state: 'Submitted',
      applicantAccessCodes: [],
    };

    mockApiClient.sendEvent.mockResolvedValue(expectedResult);

    const result = await api.triggerEvent(caseId, userData, eventName);

    expect(mockApiClient.sendEvent).toHaveBeenCalledTimes(1);
    expect(mockApiClient.sendEvent).toHaveBeenCalledWith(
      caseId,
      userData,
      eventName
    );
    expect(result).toEqual(expectedResult);
  });

  test('should propagate errors thrown by apiClient.sendEvent', async () => {
    const caseId = '123456';
    const eventName = EVENT_TYPE.LINK_APPLICANT_TO_CASE;

    mockApiClient.sendEvent.mockRejectedValue(
      new Error('Case could not be updated.')
    );

    await expect(
      api.triggerEvent(caseId, {}, eventName)
    ).rejects.toThrow('Case could not be updated.');

    expect(mockApiClient.sendEvent).toHaveBeenCalledTimes(1);
  });
});

describe('CaseApi.getUsersRoleOnCase', () => {
  const mockApiClient = {
    getCaseUserRoles: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
  } as unknown as LoggerInstance;

  let api: CaseApi;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new CaseApi(
      mockApiClient as unknown as caseApiClient.CaseApiClient,
      mockLogger
    );
  });

  test('returns the user case role when one exists', async () => {
    mockApiClient.getCaseUserRoles.mockResolvedValue({
      case_users: [
        {
          case_id: '1234',
          user_id: 'user1',
          case_role: CaseRole.APPLICANT,
        },
      ],
    });

    const result = await api.getUsersRoleOnCase('1234', 'user1');

    expect(mockApiClient.getCaseUserRoles).toHaveBeenCalledWith({
      case_ids: ['1234'],
      user_ids: ['user1'],
    });
    expect(result).toBe(CaseRole.APPLICANT);
  });

  test('returns undefined when the user has no role on the case', async () => {
    mockApiClient.getCaseUserRoles.mockResolvedValue({
      case_users: [],
    });

    const result = await api.getUsersRoleOnCase('1234', 'user1');

    expect(mockApiClient.getCaseUserRoles).toHaveBeenCalledWith({
      case_ids: ['1234'],
      user_ids: ['user1'],
    });
    expect(result).toBeUndefined();
  });
});

describe('triggerSystemEvent', () => {
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
  } as unknown as LoggerInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('gets system user, case api and triggers event', async () => {
    const systemUser = { accessToken: 'sys-token' } as UserDetails;
    const triggerEvent = jest.fn().mockResolvedValue({ id: '123456', state: 'Submitted' });
    const caseApi = { triggerEvent } as unknown as CaseApi;

    jest.mocked(getSystemUser).mockResolvedValue(systemUser);
    jest.spyOn(caseApiModule, 'getCaseApi').mockReturnValue(caseApi);

    const result = await triggerSystemEvent(
      '123456',
      { applicantAccessCodes: [] },
      EVENT_TYPE.LINK_APPLICANT_TO_CASE,
      mockLogger
    );

    expect(getSystemUser).toHaveBeenCalledTimes(1);
    expect(caseApiModule.getCaseApi).toHaveBeenCalledWith(systemUser, mockLogger);
    expect(triggerEvent).toHaveBeenCalledWith(
      '123456',
      { applicantAccessCodes: [] },
      EVENT_TYPE.LINK_APPLICANT_TO_CASE
    );
    expect(result).toEqual({ id: '123456', state: 'Submitted' });
  });

  test('propagates error when triggerEvent fails', async () => {
    const systemUser = { accessToken: 'sys-token' } as UserDetails;
    const triggerEvent = jest.fn().mockRejectedValue(new Error('CCD error'));
    const caseApi = { triggerEvent } as unknown as CaseApi;

    jest.mocked(getSystemUser).mockResolvedValue(systemUser);
    jest.spyOn(caseApiModule, 'getCaseApi').mockReturnValue(caseApi);

    await expect(
      triggerSystemEvent('123456', {}, EVENT_TYPE.LINK_RESPONDENT_TO_CASE, mockLogger)
    ).rejects.toThrow('CCD error');

    expect(getSystemUser).toHaveBeenCalledTimes(1);
    expect(caseApiModule.getCaseApi).toHaveBeenCalledWith(systemUser, mockLogger);
    expect(triggerEvent).toHaveBeenCalledWith(
      '123456',
      {},
      EVENT_TYPE.LINK_RESPONDENT_TO_CASE
    );
  });
});
