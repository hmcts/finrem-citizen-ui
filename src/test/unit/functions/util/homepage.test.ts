import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Request } from 'express';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../../../main/app/auth/user';
import { getCaseApi } from '../../../../main/app/case/case-api';
import { UserDetails } from '../../../../main/app/controller/AppRequest';
import { RouteNames } from '../../../../main/common-constants';
import { getHomePageForUser, loadCaseAndReloadSession } from '../../../../main/functions/util/commonUtil';

jest.mock('config', () => ({
  get: jest.fn(() => 'http://ccd.test.local'),
}));

jest.mock('../../../../main/app/case/case-api', () => ({
  getCaseApi: jest.fn(),
}));

jest.mock('../../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn(),
}));

describe('getHomePageForUser', () => {
  let mockGetExistingUserCase: jest.MockedFunction<() => Promise<string | undefined>>;
  let mockGetCaseById: jest.MockedFunction<(caseId: string) => Promise<unknown>>;
  let userDetails: UserDetails;

  beforeEach(() => {
    mockGetExistingUserCase = jest.fn() as unknown as jest.MockedFunction<() => Promise<string | undefined>>;
    mockGetCaseById = jest.fn() as unknown as jest.MockedFunction<(caseId: string) => Promise<unknown>>;

    jest.mocked(getCaseApi).mockReturnValue({
      getExistingUserCase: mockGetExistingUserCase,
      getCaseById: mockGetCaseById,
    } as unknown as ReturnType<typeof getCaseApi>);

    jest.mocked(getSystemUser).mockResolvedValue({
      accessToken: 'mock-access',
      idToken: 'mock-id',
      refreshToken: undefined,
      sub: '123',
      id: 'system-user',
      email: 'system@test.com',
      givenName: 'System',
      familyName: 'User',
      roles: ['admin'],
    } as unknown as Awaited<ReturnType<typeof getSystemUser>>);

    userDetails = {  accessToken: 'token',
      idToken: 'id',
      refreshToken: undefined,
      sub: 'test@test.com',
      email: 'test@test.com',
      givenName: 'John',
      familyName: 'Dorian',
      id: '123',
      roles: ['citizen'] };
  });

  test('should route to dashboard when caseId exists', async () => {
    const mockCaseData = { id: 'CASE123' };

    mockGetExistingUserCase.mockResolvedValue('CASE123');
    mockGetCaseById.mockResolvedValue(mockCaseData);

    const homepageResult = await getHomePageForUser(userDetails);

    const expectedResult = {
      caseData: {
        id: 'CASE123',
      },
      url: RouteNames.dashboard,
    };

    expect(mockGetExistingUserCase).toHaveBeenCalled();
    expect(mockGetCaseById).toHaveBeenCalledWith('CASE123');
    expect(homepageResult).toEqual(expectedResult);
    expect(getSystemUser).toHaveBeenCalled();
  });

  test.each<[string, string | undefined]>([
    ['empty string', ''],
    ['undefined', undefined],
  ])(
    'should route to enterCaseNumber when caseId is %s',
    async (_label, caseId) => {
      mockGetExistingUserCase.mockResolvedValue(caseId);

      const result = await getHomePageForUser(userDetails);

      expect(mockGetCaseById).not.toHaveBeenCalled();
      expect(result).toEqual({ 'url': RouteNames.enterCaseNumber });
    }
  );
});

describe('loadCaseAndReloadSession', () => {
  let mockGetCaseById: jest.MockedFunction<(caseId: string) => Promise<unknown>>;
  let mockLogger: LoggerInstance;
  let mockReq: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCaseById = jest.fn() as unknown as jest.MockedFunction<(caseId: string) => Promise<unknown>>;

    jest.mocked(getCaseApi).mockReturnValue({
      getCaseById: mockGetCaseById,
    } as unknown as ReturnType<typeof getCaseApi>);

    jest.mocked(getSystemUser).mockResolvedValue({
      accessToken: 'mock-access',
      idToken: 'mock-id',
      refreshToken: undefined,
      sub: '123',
      id: 'system-user',
      email: 'system@test.com',
      givenName: 'System',
      familyName: 'User',
      roles: ['admin'],
    } as unknown as Awaited<ReturnType<typeof getSystemUser>>);

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerInstance;

    mockReq = {
      session: {},
    } as unknown as Request;
  });

  test('loads case by normalised case reference and stores caseData in session', async () => {
    const caseData = { id: '1234567890123456' };
    mockGetCaseById.mockResolvedValue(caseData);

    const result = await loadCaseAndReloadSession(mockReq, '1234-5678-9012-3456', mockLogger);

    expect(getSystemUser).toHaveBeenCalled();
    expect(getCaseApi).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'system-user' }),
      mockLogger
    );
    expect(mockGetCaseById).toHaveBeenCalledWith('1234567890123456');
    expect(result).toEqual(caseData);
    expect((mockReq.session as { caseData?: unknown }).caseData).toEqual(caseData);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Loading case 1234567890123456 from CCD backend: http://ccd.test.local'
    );
    expect(mockLogger.info).toHaveBeenCalledWith('Case 1234567890123456 successfully loaded from CCD');
  });

  test('loads case when case reference contains no hyphens', async () => {
    const caseData = { id: '1234567890123456' };
    mockGetCaseById.mockResolvedValue(caseData);

    await loadCaseAndReloadSession(mockReq, '1234567890123456', mockLogger);

    expect(mockGetCaseById).toHaveBeenCalledWith('1234567890123456');
    expect((mockReq.session as { caseData?: unknown }).caseData).toEqual(caseData);
  });

  test('logs and rethrows when case cannot be loaded from CCD', async () => {
    const ccdError = new Error('CCD unavailable');
    mockGetCaseById.mockRejectedValue(ccdError);

    await expect(
      loadCaseAndReloadSession(mockReq, '1234-5678-9012-3456', mockLogger)
    ).rejects.toThrow('CCD unavailable');

    expect((mockReq.session as { caseData?: unknown }).caseData).toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to load case 1234567890123456 from CCD:',
      ccdError
    );
  });

  test('logs and rethrows when getting system user fails', async () => {
    const systemUserError = new Error('IDAM unavailable');
    jest.mocked(getSystemUser).mockRejectedValue(systemUserError);

    await expect(
      loadCaseAndReloadSession(mockReq, '1234-5678-9012-3456', mockLogger)
    ).rejects.toThrow('IDAM unavailable');

    expect(getCaseApi).not.toHaveBeenCalled();
    expect((mockReq.session as { caseData?: unknown }).caseData).toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to load case 1234567890123456 from CCD:',
      systemUserError
    );
  });
});
