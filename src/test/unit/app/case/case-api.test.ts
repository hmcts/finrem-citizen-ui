import { LoggerInstance } from 'winston';

import { CaseApi, getCaseApi } from '../../../../main/app/case/case-api';
import * as caseApiClient from '../../../../main/app/case/case-api-client';
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
    api = new CaseApi(mockApiClient as unknown as caseApiClient.CaseApiClient, mockLogger as unknown as LoggerInstance);
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

  const api = new CaseApi(
    mockApiClient as unknown as caseApiClient.CaseApiClient,
    mockLogger as unknown as LoggerInstance
  );

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
    api = new CaseApi(mockApiClient as unknown as caseApiClient.CaseApiClient, mockLogger as unknown as LoggerInstance);
  });

  test('should return undefined when user has no cases', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([]);

    const result = await api.getExistingUserCase('NFD');

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith('NFD');
    expect(result).toBeUndefined();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('should return case id as string when exactly one case exists', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([{ id: 987654321, state: 'Submitted' }]);

    const result = await api.getExistingUserCase('NFD');

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith('NFD');
    expect(result).toBe('987654321');
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('should log error and throw when more than one case exists', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([
      { id: '1111', state: 'Draft' },
      { id: '2222', state: 'Submitted' },
    ]);

    await expect(api.getExistingUserCase('NFD')).rejects.toThrow(
      'More than one case found for caseType "NFD". Expected exactly one. Found: 2.'
    );

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith('NFD');
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'More than one case found for caseType "NFD". Expected exactly one. Found: 2.'
    );
  });

  test('should propagate errors from apiClient.findExistingUserCases', async () => {
    mockApiClient.findExistingUserCases.mockRejectedValue(new Error('upstream error'));

    await expect(api.getExistingUserCase('NFD')).rejects.toThrow('upstream error');

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith('NFD');
    expect(mockLogger.error).not.toHaveBeenCalled();
  });
});

describe('CaseApi.getExistingUserCaseByType', () => {
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
    api = new CaseApi(mockApiClient as unknown as caseApiClient.CaseApiClient, mockLogger as unknown as LoggerInstance);
  });

  test('should return undefined when user has no cases for given type', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([]);

    const result = await api.getExistingUserCaseByType('NFD');

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledTimes(1);
    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith('NFD');
    expect(result).toBeUndefined();
  });

  test('should return case id as string when exactly one case exists for given type', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([{ id: 987654321, state: 'Submitted' }]);

    const result = await api.getExistingUserCaseByType('NFD');

    expect(mockApiClient.findExistingUserCases).toHaveBeenCalledWith('NFD');
    expect(result).toBe('987654321');
  });

  test('should log error and throw when more than one case exists for given type', async () => {
    mockApiClient.findExistingUserCases.mockResolvedValue([
      { id: '1111', state: 'Draft' },
      { id: '2222', state: 'Submitted' },
    ]);

    await expect(api.getExistingUserCaseByType('NFD')).rejects.toThrow(
      'More than one case found for caseType "NFD". Expected exactly one. Found: 2.'
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'More than one case found for caseType "NFD". Expected exactly one. Found: 2.'
    );
  });
});
