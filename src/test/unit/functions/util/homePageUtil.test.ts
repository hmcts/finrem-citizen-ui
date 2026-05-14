import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Request } from 'express';
import { SessionData } from 'express-session';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../../../main/app/auth/user';
import { getCaseApi } from '../../../../main/app/case/case-api';
import { CASE_TYPE } from '../../../../main/app/case/case-type';
import { CaseType } from '../../../../main/app/case/definition';
import { UserDetails } from '../../../../main/app/controller/AppRequest';
import { RouteNames } from '../../../../main/common-constants';
import * as homePageUtil from '../../../../main/functions/util/homePageUtil';
import {
  getHomePageForUser,
  loadCaseAndReloadSession,
} from '../../../../main/functions/util/homePageUtil';

jest.mock('config', () => ({
  get: jest.fn(() => 'http://ccd.test.local'),
}));

jest.mock('../../../../main/app/case/case-api', () => ({
  getCaseApi: jest.fn(),
}));

jest.mock('../../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn(),
}));

type MinimalCaseData = { id: string };

type GetExistingUserCaseMock = (
  caseType: CaseType | string
) => Promise<string | undefined>;

type GetCaseByIdMock = (caseId: string) => Promise<MinimalCaseData>;

type HomePageCaseApiMock = {
  getExistingUserCase: jest.MockedFunction<GetExistingUserCaseMock>;
  getCaseById: jest.MockedFunction<GetCaseByIdMock>;
};

type ReloadSessionCaseApiMock = {
  getCaseById: jest.MockedFunction<GetCaseByIdMock>;
};

const createCaseData = (id: string): MinimalCaseData => ({ id });

const createSystemUser = (): UserDetails => ({
  accessToken: 'mock-access',
  idToken: 'mock-id',
  refreshToken: undefined,
  sub: '123',
  id: 'system-user',
  email: 'system@test.com',
  givenName: 'System',
  familyName: 'User',
  roles: ['admin'],
});

const createUserDetails = (): UserDetails => ({
  accessToken: 'token',
  idToken: 'id',
  refreshToken: undefined,
  sub: 'test@test.com',
  email: 'test@test.com',
  givenName: 'John',
  familyName: 'Dorian',
  id: '123',
  roles: ['citizen'],
});

describe('getHomePageForUser', () => {
  let mockGetExistingUserCase: jest.MockedFunction<GetExistingUserCaseMock>;
  let mockGetCaseById: jest.MockedFunction<GetCaseByIdMock>;
  let userDetails: UserDetails;
  let mockLogger: LoggerInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetExistingUserCase = jest.fn<GetExistingUserCaseMock>();
    mockGetCaseById = jest.fn<GetCaseByIdMock>();

    const caseApiMock: HomePageCaseApiMock = {
      getExistingUserCase: mockGetExistingUserCase,
      getCaseById: mockGetCaseById,
    };

    jest
      .mocked(getCaseApi)
      .mockReturnValue(caseApiMock as unknown as ReturnType<typeof getCaseApi>);

    jest.mocked(getSystemUser).mockResolvedValue(createSystemUser());

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerInstance;

    userDetails = createUserDetails();
  });

  test('should route to dashboard when caseId exists', async () => {
    const mockCaseData = createCaseData('CASE123');

    mockGetExistingUserCase.mockResolvedValue('CASE123');
    mockGetCaseById.mockResolvedValue(mockCaseData);

    const homepageResult = await getHomePageForUser(userDetails);

    expect(mockGetExistingUserCase).toHaveBeenCalledWith(CASE_TYPE);
    expect(mockGetCaseById).toHaveBeenCalledWith('CASE123');
    expect(homepageResult).toEqual({
      caseData: { id: 'CASE123' },
      caseNumber: 'CASE123',
      url: RouteNames.dashboard,
    });
    expect(getSystemUser).toHaveBeenCalled();
  });

  test.each<[string, string | undefined]>([
    ['empty string', ''],
    ['undefined', undefined],
  ])('should route to enterCaseNumber when caseId is %s', async (_label, caseId) => {
    mockGetExistingUserCase.mockResolvedValue(caseId);

    const result = await getHomePageForUser(userDetails);

    expect(mockGetExistingUserCase).toHaveBeenCalledWith(CASE_TYPE);
    expect(mockGetCaseById).not.toHaveBeenCalled();
    expect(result).toEqual({ url: RouteNames.enterCaseNumber });
  });

  test('should fetch NFD case and include hasNFDCase when not already checked', async () => {
    mockGetExistingUserCase.mockResolvedValue('NFD123');
    mockGetCaseById.mockResolvedValue({ id: 'CASE123' });

    const result = await homePageUtil.orchestrateHome(
      userDetails,
      mockLogger
    );

    expect(mockGetExistingUserCase).toHaveBeenCalledWith(CaseType.NFD);
    expect(mockGetExistingUserCase).toHaveBeenCalledWith(CASE_TYPE);
    expect(userDetails.hasNFDCase).toBe(true);

    expect(result).toEqual({
      url: RouteNames.dashboard,
      caseData: { id: 'CASE123' },
      caseNumber: 'NFD123',
    });
  });

  test('should skip NFD lookup if already checked', async () => {
    mockGetExistingUserCase.mockResolvedValue('CASE123');
    mockGetCaseById.mockResolvedValue({ id: 'CASE123' });
    userDetails.hasNFDCase = true;
    const result = await homePageUtil.orchestrateHome(
      userDetails,
      mockLogger
    );

    expect(mockGetExistingUserCase).not.toHaveBeenCalledWith(CaseType.NFD);
    expect(mockGetExistingUserCase).toHaveBeenCalledWith(CASE_TYPE);
    expect(userDetails.hasNFDCase).toBe(true);

    expect(result).toEqual({
      url: RouteNames.dashboard,
      caseData: { id: 'CASE123' },
      caseNumber: 'CASE123',
    });
  });

  test('should set hasNFDCase to false when no NFD case found', async () => {
    mockGetExistingUserCase.mockResolvedValue(undefined);

    const result = await homePageUtil.orchestrateHome(
      userDetails,
      mockLogger
    );

    expect(mockGetExistingUserCase).toHaveBeenCalledWith(CaseType.NFD);
    expect(mockGetExistingUserCase).toHaveBeenCalledWith(CASE_TYPE);
    expect(userDetails.hasNFDCase).toBe(false);
    expect(result).toEqual({
      url: RouteNames.enterCaseNumber,
      caseData: undefined
    });
  });
});

describe('loadCaseAndReloadSession', () => {
  let mockGetCaseById: jest.MockedFunction<GetCaseByIdMock>;
  let mockLogger: LoggerInstance;
  let mockReq: Request;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCaseById = jest.fn<GetCaseByIdMock>();

    const caseApiMock: ReloadSessionCaseApiMock = {
      getCaseById: mockGetCaseById,
    };

    jest
      .mocked(getCaseApi)
      .mockReturnValue(caseApiMock as unknown as ReturnType<typeof getCaseApi>);

    jest.mocked(getSystemUser).mockResolvedValue(createSystemUser());

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerInstance;

    mockReq = {
      session: {},
    } as unknown as Request;
  });

  test('loads case by normalised case reference and stores caseData in session', async () => {
    const caseData = createCaseData('1234567890123456');
    mockGetCaseById.mockResolvedValue(caseData);

    const result = await loadCaseAndReloadSession(
      mockReq,
      '1234-5678-9012-3456',
      mockLogger
    );

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
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Case 1234567890123456 successfully loaded from CCD'
    );
  });

  test('loads case when case reference contains no hyphens', async () => {
    const caseData = createCaseData('1234567890123456');
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

describe('setCaseUserRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sets caseRole when caseNumber exists and caseRole is undefined', async () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
      },
    } as unknown as SessionData;

    const getUsersRoleOnCase = jest.fn().mockImplementation(
      async () => 'APPLICANT'
    );

    jest.mocked(getCaseApi).mockReturnValue({
      getUsersRoleOnCase,
    } as unknown as ReturnType<typeof getCaseApi>);

    await homePageUtil.setCaseUserRole(session);

    expect(getUsersRoleOnCase).toHaveBeenCalledWith('CASE123', 'user-1');
    const typedSession = session as unknown as {
      user: { caseRole?: string };
    };

    expect(typedSession.user.caseRole).toBe('APPLICANT');

  });

  test('does nothing when caseNumber is missing', async () => {
    const session = {
      user: {
        id: 'user-2',
      },
    } as unknown as SessionData;

    await homePageUtil.setCaseUserRole(session);

    expect(getCaseApi).not.toHaveBeenCalled();
  });

  test('does nothing when caseRole is already set', async () => {
    const session = {
      caseNumber: 'CASE456',
      user: {
        id: 'user-3',
        caseRole: 'RESPONDENT',
      },
    } as unknown as SessionData;

    await homePageUtil.setCaseUserRole(session);

    expect(getCaseApi).not.toHaveBeenCalled();
  });

  test('sets caseUserName for APPLICANT when caseRole and caseData exist', async () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: '[APPLICANT]',
      },
      caseData: {
        applicantFlags: {
          partyName: 'John Smith',
        },
      },
    } as unknown as SessionData;

    await homePageUtil.setCaseUserRole(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe('John Smith');
  });

  test('sets caseUserName for RESPONDENT when caseRole and caseData exist', async () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: '[RESPONDENT]',
      },
      caseData: {
        respondentFlags: {
          partyName: 'Jane Doe',
        },
      },
    } as unknown as SessionData;

    await homePageUtil.setCaseUserRole(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe('Jane Doe');
  });

  test('sets default caseUserName for APPLICANT when partyName is missing', async () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: '[APPLICANT]',
      },
      caseData: {
        applicantFlags: {},
      },
    } as unknown as SessionData;

    await homePageUtil.setCaseUserRole(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe('Applicant');
  });

  test('sets default caseUserName for RESPONDENT when partyName is missing', async () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: '[RESPONDENT]',
      },
      caseData: {
        respondentFlags: {},
      },
    } as unknown as SessionData;

    await homePageUtil.setCaseUserRole(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe('Respondent');
  });

  test('does not set caseUserName when caseUserName is already set', async () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: '[APPLICANT]',
      },
      caseData: {
        applicantFlags: {
          partyName: 'John Smith',
        },
      },
      caseUserName: 'Existing Name',
    } as unknown as SessionData;

    await homePageUtil.setCaseUserRole(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe('Existing Name');
  });

  test('does not set caseUserName when caseData is missing', async () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: '[APPLICANT]',
      },
    } as unknown as SessionData;

    await homePageUtil.setCaseUserRole(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBeUndefined();
  });
});
