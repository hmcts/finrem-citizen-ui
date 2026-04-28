
import { LoggerInstance } from 'winston';

import { CaseApi, getCaseApi } from '../../../../main/app/case/case-api';
import * as caseApiClient from '../../../../main/app/case/case-api-client';
import { CASE_TYPE, EVENT_TYPE } from '../../../../main/app/case/case-type';
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
  const mockApiClient = {
    getCaseById: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn().mockImplementation((msg: string) => msg),
    info: jest.fn().mockImplementation((msg: string) => msg),
  } as unknown as LoggerInstance;

  let api: CaseApi;
  beforeEach(() => {
    api = new CaseApi(mockApiClient as unknown as caseApiClient.CaseApiClient,
      mockLogger as unknown as LoggerInstance);
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

describe('CaseApi.getExistingUserCase', () => {
  const mockApiClient = {
    findExistingUserCases: jest.fn(),
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

  test('should return undefined when user has no cases', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([]);

    const result = await api.getExistingUserCase(CASE_TYPE);

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith(CASE_TYPE);
    expect(result).toBeUndefined();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('should return case id as string when exactly one case exists', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([
      { id: 987654321, state: 'Submitted' },
    ]);

    const result = await api.getExistingUserCase(CASE_TYPE);

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith(CASE_TYPE);
    expect(result).toBe('987654321');
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('should log error and throw when more than one case exists', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([
      { id: '1111', state: 'Draft' },
      { id: '2222', state: 'Submitted' },
    ]);

    await expect(api.getExistingUserCase(CASE_TYPE)).rejects.toThrow(
      `More than one case found for caseType "${CASE_TYPE}". Expected exactly one. Found: 2.`
    );

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith(CASE_TYPE);
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      `More than one case found for caseType "${CASE_TYPE}". Expected exactly one. Found: 2.`
    );
  });

  test('should propagate errors from apiClient.findExistingUserCases', async () => {
    mockApiClient.findExistingUserCases.mockRejectedValue(new Error('upstream error'));

    await expect(api.getExistingUserCase(CASE_TYPE)).rejects.toThrow('upstream error');

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith(CASE_TYPE);
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
    const eventName = EVENT_TYPE.INVALIDATE_APPLICANT_ACCESS_CODE;

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
    const eventName = EVENT_TYPE.INVALIDATE_APPLICANT_ACCESS_CODE;

    mockApiClient.sendEvent.mockRejectedValue(
      new Error('Case could not be updated.')
    );

    await expect(
      api.triggerEvent(caseId, {}, eventName)
    ).rejects.toThrow('Case could not be updated.');

    expect(mockApiClient.sendEvent).toHaveBeenCalledTimes(1);
  });
});