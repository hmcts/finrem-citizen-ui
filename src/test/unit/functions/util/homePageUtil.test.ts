import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Request } from 'express';
import { SessionData } from 'express-session';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../../../main/app/auth/user';
import { getCaseApi } from '../../../../main/app/case/case-api';
import { CaseRole, YesOrNo } from '../../../../main/app/case/definition';
import { UserDetails } from '../../../../main/app/controller/AppRequest';
import { CaseUserNames, RouteNames } from '../../../../main/constants';
import * as homePageUtil from '../../../../main/functions/util/homePageUtil';
import {
  fetchUserCaseContext,
  fetchUserCaseRole,
  hydrateUserSessionWithCaseContext,
  loadCaseAndReloadSession,
  refreshUserNfdCaseFlag,
  resetCaseContext,
  resolveCaseUserName,
  resolveHomeUrl,
  resolveIsUserRepresented,
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

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

type MinimalCaseData = {
  id: string;
  applicantFlags?: {
    partyName?: string;
  };
  respondentFlags?: {
    partyName?: string;
  };
};

type GetExistingFRUserCaseMock = () => Promise<string | undefined>;
type GetExistingNfdCaseMock = () => Promise<string | undefined>;

type GetCaseByIdMock = (caseId: string) => Promise<MinimalCaseData>;
type GetUsersRoleOnCaseMock = (caseId: string, userId: string) => Promise<CaseRole | undefined>;

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

describe('fetchUserCaseContext and resolveHomeUrl', () => {
  let mockGetExistingFRUserCase: jest.MockedFunction<GetExistingFRUserCaseMock>;
  let mockGetExistingNfdCase: jest.MockedFunction<GetExistingNfdCaseMock>;
  let mockGetCaseById: jest.MockedFunction<GetCaseByIdMock>;
  let userDetails: UserDetails;
  let mockLogger: LoggerInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetExistingFRUserCase = jest.fn<GetExistingFRUserCaseMock>();
    mockGetExistingNfdCase = jest.fn<GetExistingNfdCaseMock>();
    mockGetCaseById = jest.fn<GetCaseByIdMock>();

    jest.mocked(getSystemUser).mockResolvedValue(createSystemUser());

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerInstance;

    userDetails = createUserDetails();
  });

  test('loads context with case data when FR case exists and refreshes NFD flag', async () => {
    mockGetExistingFRUserCase.mockResolvedValue('CASE123');
    mockGetExistingNfdCase.mockResolvedValue('NFD123');
    mockGetCaseById.mockResolvedValue({ id: 'CASE123' });

    jest
      .mocked(getCaseApi)
      .mockReturnValueOnce({
        getExistingFRUserCase: mockGetExistingFRUserCase,
      } as unknown as ReturnType<typeof getCaseApi>)
      .mockReturnValueOnce({
        getExistingNfdCase: mockGetExistingNfdCase,
      } as unknown as ReturnType<typeof getCaseApi>)
      .mockReturnValueOnce({
        getCaseById: mockGetCaseById,
      } as unknown as ReturnType<typeof getCaseApi>);

    const result = await fetchUserCaseContext(userDetails, mockLogger);

    expect(result).toEqual({
      caseData: { id: 'CASE123' },
      caseNumber: 'CASE123',
    });
    expect(resolveHomeUrl(result)).toBe(RouteNames.dashboard);
    expect(userDetails.hasNFDCase).toBe(true);
    expect(getSystemUser).toHaveBeenCalledTimes(1);
  });

  test('loads empty context when no FR case exists and skips NFD/system-user lookups', async () => {
    mockGetExistingFRUserCase.mockResolvedValue(undefined);

    jest.mocked(getCaseApi).mockReturnValue({
      getExistingFRUserCase: mockGetExistingFRUserCase,
    } as unknown as ReturnType<typeof getCaseApi>);

    const result = await fetchUserCaseContext(userDetails, mockLogger);

    expect(result).toEqual({});
    expect(resolveHomeUrl(result)).toBe(RouteNames.enterCaseNumber);
    expect(getCaseApi).toHaveBeenCalledTimes(1);
    expect(getSystemUser).not.toHaveBeenCalled();
  });

  test('hydrates session with case context, role, and derived user name', async () => {
    mockGetExistingFRUserCase.mockResolvedValue('CASE123');
    mockGetExistingNfdCase.mockResolvedValue(undefined);
    mockGetCaseById.mockResolvedValue({
      id: 'CASE123',
      applicantFlags: {
        partyName: 'John Smith',
      },
    });

    const getUsersRoleOnCase = jest.fn<GetUsersRoleOnCaseMock>().mockResolvedValue(CaseRole.APPLICANT);

    jest
      .mocked(getCaseApi)
      .mockReturnValueOnce({
        getExistingFRUserCase: mockGetExistingFRUserCase,
      } as unknown as ReturnType<typeof getCaseApi>)
      .mockReturnValueOnce({
        getExistingNfdCase: mockGetExistingNfdCase,
      } as unknown as ReturnType<typeof getCaseApi>)
      .mockReturnValueOnce({
        getCaseById: mockGetCaseById,
      } as unknown as ReturnType<typeof getCaseApi>)
      .mockReturnValueOnce({
        getUsersRoleOnCase,
      } as unknown as ReturnType<typeof getCaseApi>);

    const session = {
      user: userDetails,
    } as unknown as SessionData;

    const result = await hydrateUserSessionWithCaseContext(session, mockLogger);
    const typedSession = session as unknown as {
      caseNumber?: string;
      caseUserName?: string;
      user: { caseRole?: CaseRole; hasNFDCase?: boolean };
    };

    expect(result).toEqual({
      caseData: {
        id: 'CASE123',
        applicantFlags: {
          partyName: 'John Smith',
        },
      },
      caseNumber: 'CASE123',
    });
    expect(typedSession.caseNumber).toBe('CASE123');
    expect(typedSession.user.caseRole).toBe(CaseRole.APPLICANT);
    expect(typedSession.caseUserName).toBe('John Smith');
    expect(typedSession.user.hasNFDCase).toBe(false);
  });

  test('hydrates session and derives case user name when role already exists', async () => {
    mockGetExistingFRUserCase.mockResolvedValue('CASE123');
    mockGetExistingNfdCase.mockResolvedValue('NFD123');
    mockGetCaseById.mockResolvedValue({
      id: 'CASE123',
      applicantFlags: {
        partyName: 'John Smith',
      },
    });

    jest
      .mocked(getCaseApi)
      .mockReturnValueOnce({
        getExistingFRUserCase: mockGetExistingFRUserCase,
      } as unknown as ReturnType<typeof getCaseApi>)
      .mockReturnValueOnce({
        getExistingNfdCase: mockGetExistingNfdCase,
      } as unknown as ReturnType<typeof getCaseApi>)
      .mockReturnValueOnce({
        getCaseById: mockGetCaseById,
      } as unknown as ReturnType<typeof getCaseApi>);

    const session = {
      user: {
        ...userDetails,
        caseRole: CaseRole.APPLICANT,
      },
    } as unknown as SessionData;

    await hydrateUserSessionWithCaseContext(session, mockLogger);
    const typedSession = session as unknown as {
      caseUserName?: string;
      user: { caseRole?: CaseRole; hasNFDCase?: boolean };
    };

    expect(typedSession.user.caseRole).toBe(CaseRole.APPLICANT);
    expect(typedSession.caseUserName).toBe('John Smith');
    expect(typedSession.user.hasNFDCase).toBe(true);
  });

  test('clears stale session case context, role, and user name when no FR case is found', async () => {
    mockGetExistingFRUserCase.mockResolvedValue(undefined);

    jest.mocked(getCaseApi).mockReturnValue({
      getExistingFRUserCase: mockGetExistingFRUserCase,
    } as unknown as ReturnType<typeof getCaseApi>);

    const session = {
      caseNumber: 'OLD-CASE',
      caseData: { id: 'OLD-CASE' },
      caseUserName: 'Old Name',
      user: {
        ...userDetails,
        caseRole: CaseRole.RESPONDENT,
      },
    } as unknown as SessionData;

    const result = await hydrateUserSessionWithCaseContext(session, mockLogger);
    const typedSession = session as unknown as {
      caseNumber?: string;
      caseData?: MinimalCaseData;
      caseUserName?: string;
      user: { caseRole?: CaseRole };
    };

    expect(result).toEqual({});
    expect(typedSession.caseNumber).toBeUndefined();
    expect(typedSession.caseData).toBeUndefined();
    expect(typedSession.caseUserName).toBeUndefined();
    expect(typedSession.user.caseRole).toBeUndefined();
  });
});

describe('refreshUserNfdCaseFlag', () => {
  let mockLogger: LoggerInstance;
  let userDetails: UserDetails;
  let mockGetExistingNfdCase: jest.MockedFunction<GetExistingNfdCaseMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    userDetails = createUserDetails();
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerInstance;
    mockGetExistingNfdCase = jest.fn<GetExistingNfdCaseMock>();
  });

  test('sets hasNFDCase true when NFD case exists', async () => {
    mockGetExistingNfdCase.mockResolvedValue('NFD123');

    jest.mocked(getCaseApi).mockReturnValue({
      getExistingNfdCase: mockGetExistingNfdCase,
    } as unknown as ReturnType<typeof getCaseApi>);

    await refreshUserNfdCaseFlag(userDetails, mockLogger);

    expect(userDetails.hasNFDCase).toBe(true);
    expect(mockGetExistingNfdCase).toHaveBeenCalledTimes(1);
  });

  test('sets hasNFDCase false when no NFD case exists', async () => {
    mockGetExistingNfdCase.mockResolvedValue(undefined);

    jest.mocked(getCaseApi).mockReturnValue({
      getExistingNfdCase: mockGetExistingNfdCase,
    } as unknown as ReturnType<typeof getCaseApi>);

    await refreshUserNfdCaseFlag(userDetails, mockLogger);

    expect(userDetails.hasNFDCase).toBe(false);
  });
});

describe('loadCaseAndReloadSession', () => {
  let mockGetCaseById: jest.MockedFunction<GetCaseByIdMock>;
  let mockLogger: LoggerInstance;
  let mockReq: Request;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCaseById = jest.fn<GetCaseByIdMock>();

    jest
      .mocked(getCaseApi)
      .mockReturnValue({
        getCaseById: mockGetCaseById,
      } as unknown as ReturnType<typeof getCaseApi>);

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

    const result = await loadCaseAndReloadSession(mockReq, '1234-5678-9012-3456', mockLogger);

    expect(getSystemUser).toHaveBeenCalled();
    expect(getCaseApi).toHaveBeenCalledWith(expect.objectContaining({ id: 'system-user' }), mockLogger);
    expect(mockGetCaseById).toHaveBeenCalledWith('1234567890123456');
    expect(result).toEqual(caseData);
    expect((mockReq.session as { caseData?: unknown }).caseData).toEqual(caseData);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Loading case 1234567890123456 from CCD backend: http://ccd.test.local'
    );
    expect(mockLogger.info).toHaveBeenCalledWith('Case 1234567890123456 successfully loaded from CCD');
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

    await expect(loadCaseAndReloadSession(mockReq, '1234-5678-9012-3456', mockLogger)).rejects.toThrow(
      'CCD unavailable'
    );

    expect((mockReq.session as { caseData?: unknown }).caseData).toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to load case 1234567890123456 from CCD:', ccdError);
  });

  test('logs and rethrows when getting system user fails', async () => {
    const systemUserError = new Error('IDAM unavailable');
    jest.mocked(getSystemUser).mockRejectedValue(systemUserError);

    await expect(loadCaseAndReloadSession(mockReq, '1234-5678-9012-3456', mockLogger)).rejects.toThrow(
      'IDAM unavailable'
    );

    expect(getCaseApi).not.toHaveBeenCalled();
    expect((mockReq.session as { caseData?: unknown }).caseData).toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to load case 1234567890123456 from CCD:', systemUserError);
  });
});

describe('fetchUserCaseRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns existing caseRole without calling API', async () => {
    const session = {
      caseNumber: 'CASE789',
      user: {
        id: 'user-4',
        caseRole: 'APPLICANT',
      },
    } as unknown as SessionData;

    const result = await fetchUserCaseRole(session);

    expect(result).toBe('APPLICANT');
    expect(getCaseApi).not.toHaveBeenCalled();
  });

  test('returns caseRole from API when caseNumber exists and role is missing', async () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-5',
      },
    } as unknown as SessionData;

    const getUsersRoleOnCase = jest.fn<GetUsersRoleOnCaseMock>().mockResolvedValue(CaseRole.RESPONDENT);

    jest.mocked(getCaseApi).mockReturnValue({
      getUsersRoleOnCase,
    } as unknown as ReturnType<typeof getCaseApi>);

    const result = await fetchUserCaseRole(session);

    expect(getUsersRoleOnCase).toHaveBeenCalledWith('CASE123', 'user-5');
    expect(result).toBe(CaseRole.RESPONDENT);
  });

  test('returns undefined when caseNumber is missing', async () => {
    const session = {
      user: {
        id: 'user-6',
      },
    } as unknown as SessionData;

    const result = await fetchUserCaseRole(session);

    expect(result).toBeUndefined();
    expect(getCaseApi).not.toHaveBeenCalled();
  });
});

describe('setCaseUserName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sets caseUserName for APPLICANT when caseRole and caseData exist', () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: CaseRole.APPLICANT,
      },
      caseData: {
        applicantFlags: {
          partyName: 'John Smith',
        },
      },
    } as unknown as SessionData;

    homePageUtil.setCaseUserName(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe('John Smith');
  });

  test('sets caseUserName for RESPONDENT when caseRole and caseData exist', () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: CaseRole.RESPONDENT,
      },
      caseData: {
        respondentFlags: {
          partyName: 'Jane Doe',
        },
      },
    } as unknown as SessionData;

    homePageUtil.setCaseUserName(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe('Jane Doe');
  });

  test('sets default caseUserName for APPLICANT when partyName is missing', () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: CaseRole.APPLICANT,
      },
      caseData: {
        applicantFlags: {},
      },
    } as unknown as SessionData;

    homePageUtil.setCaseUserName(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe(CaseUserNames.APPLICANT);
  });

  test('sets default caseUserName for RESPONDENT when partyName is missing', () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: CaseRole.RESPONDENT,
      },
      caseData: {
        respondentFlags: {},
      },
    } as unknown as SessionData;

    homePageUtil.setCaseUserName(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe(CaseUserNames.RESPONDENT);
  });

  test('does not set caseUserName when caseUserName is already set', () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: CaseRole.APPLICANT,
      },
      caseData: {
        applicantFlags: {
          partyName: 'John Smith',
        },
      },
      caseUserName: 'Existing Name',
    } as unknown as SessionData;

    homePageUtil.setCaseUserName(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBe('Existing Name');
  });

  test('does not set caseUserName when caseData is missing', () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: CaseRole.APPLICANT,
      },
    } as unknown as SessionData;

    homePageUtil.setCaseUserName(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBeUndefined();
  });

  test('does not set caseUserName when caseRole is missing', () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
      },
      caseData: {
        applicantFlags: {
          partyName: 'John Smith',
        },
      },
    } as unknown as SessionData;

    homePageUtil.setCaseUserName(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBeUndefined();
  });

  test('does not set caseUserName when caseRole is not applicant or respondent', () => {
    const session = {
      caseNumber: 'CASE123',
      user: {
        id: 'user-1',
        caseRole: 'UNKNOWN_ROLE',
      },
      caseData: {
        applicantFlags: {
          partyName: 'John Smith',
        },
        respondentFlags: {
          partyName: 'Jane Doe',
        },
      },
    } as unknown as SessionData;

    homePageUtil.setCaseUserName(session);

    const typedSession = session as unknown as {
      caseUserName?: string;
    };

    expect(typedSession.caseUserName).toBeUndefined();
  });
});

describe('resolveCaseUserName', () => {
  test('returns existing caseUserName when already set', () => {
    const session = {
      caseUserName: 'Existing Name',
      user: {
        caseRole: CaseRole.APPLICANT,
      },
      caseData: {
        applicantFlags: {
          partyName: 'John Smith',
        },
      },
    } as unknown as SessionData;

    expect(resolveCaseUserName(session)).toBe('Existing Name');
  });

  test('returns derived APPLICANT name when present', () => {
    const session = {
      user: {
        caseRole: CaseRole.APPLICANT,
      },
      caseData: {
        applicantFlags: {
          partyName: 'John Smith',
        },
      },
    } as unknown as SessionData;

    expect(resolveCaseUserName(session)).toBe('John Smith');
  });

  test('returns undefined when role/data are missing', () => {
    const session = {
      user: {},
    } as unknown as SessionData;

    expect(resolveCaseUserName(session)).toBeUndefined();
  });
});

describe('resetCaseContext', () => {
  test('clears case context fields from session and user', () => {
    const session = {
      caseContextHydratedUserId: 'user-123',
      caseNumber: 'CASE123',
      caseData: { id: 'CASE123' },
      caseUserName: 'John Smith',
      user: {
        id: 'user-123',
        caseRole: CaseRole.APPLICANT,
        hasNFDCase: true,
      },
    } as unknown as SessionData;

    resetCaseContext(session);

    const typedSession = session as unknown as {
      caseContextHydratedUserId?: string;
      caseNumber?: string;
      caseData?: unknown;
      caseUserName?: string;
      user?: { caseRole?: CaseRole; hasNFDCase?: boolean };
    };

    expect(typedSession.caseContextHydratedUserId).toBeUndefined();
    expect(typedSession.caseNumber).toBeUndefined();
    expect(typedSession.caseData).toBeUndefined();
    expect(typedSession.caseUserName).toBeUndefined();
    expect(typedSession.user?.caseRole).toBeUndefined();
    expect(typedSession.user?.hasNFDCase).toBeUndefined();
  });
});

describe('resolveIsUserRepresented', () => {
  test('returns true when applicant user is represented', () => {
    const session = {
      user: {
        caseRole: CaseRole.APPLICANT,
      },
      caseData: {
        applicantRepresented: YesOrNo.YES,
      }
    } as unknown as SessionData;

    expect(resolveIsUserRepresented(session)).toBe(true);
  });

  test('returns true when respondent user is represented', () => {
    const session = {
      user: {
        caseRole: CaseRole.RESPONDENT,
      },
     caseData: {
        respondentRepresented: YesOrNo.YES,
      }
    } as unknown as SessionData;

    expect(resolveIsUserRepresented(session)).toBe(true);
  });

  test('returns false when applicant user is not represented', () => {
    const session = {
      user: {
        caseRole: CaseRole.APPLICANT,
      },
      caseData: {
        applicantRepresented: YesOrNo.NO,
      }
    } as unknown as SessionData;

    expect(resolveIsUserRepresented(session)).toBe(false);
  });

  test('returns false when respondent user is not represented', () => {
    const session = {
      user: {
        caseRole: CaseRole.RESPONDENT,
      },
      caseData: {
        respondentRepresented: YesOrNo.NO,
      }
    } as unknown as SessionData;

    expect(resolveIsUserRepresented(session)).toBe(false);
  });

  test('returns false when representation info is missing', () => {
    const session = {
      user: {
        caseRole: CaseRole.APPLICANT,
      },
      caseData: {
        applicantFlags: {},
      },
    } as unknown as SessionData;

    expect(resolveIsUserRepresented(session)).toBe(false);
  });

  test('returns undefined when case role is missing', () => {
    const session = {
      user: {
        caseRole: undefined,
      },
      caseData: {
        applicantFlags: {},
      },
    } as unknown as SessionData;

    expect(resolveIsUserRepresented(session)).toBeUndefined();
  });

  test('returns undefined when case data is missing', () => {
    const session = {
      user: {
        caseRole: CaseRole.APPLICANT,
      },
      caseData: undefined,
    } as unknown as SessionData;

    expect(resolveIsUserRepresented(session)).toBeUndefined();
  });
});
