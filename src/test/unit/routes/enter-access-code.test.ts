import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { getSystemUser } from '../../../main/app/auth/user';
import { getCaseApi } from '../../../main/app/case/case-api';
import { EVENT_TYPE } from '../../../main/app/case/case-type';
import {
  AccessCodeCollection,
  CaseRole,
  FinremCaseData,
  YesOrNo,
} from '../../../main/app/case/definition';
import setupEnterAccessCodeRoute, {
  addUserToCaseForRole,
  getMatchingAccessCode,
  invalidateAccessCode,
  retrieveCaseData,
  validateAccessCode,
  validateAccessCodeAgainstCase,
} from '../../../main/routes/enter-access-code';

jest.mock('../../../main/middleware', () => ({
  oidcMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('@hmcts/nodejs-logging', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };
  return {
    Logger: {
      getLogger: jest.fn(() => mockLogger),
    },
  };
});

const { Logger } = require('@hmcts/nodejs-logging');
const mockLogger = Logger.getLogger('enter-access-code');


jest.mock('../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn(),
}));

jest.mock('../../../main/app/case/case-api', () => ({
  getCaseApi: jest.fn(),
}));

describe('validateAccessCode', () => {
  it('should return error when access code is empty', () => {
    expect(validateAccessCode(undefined)?.accessCode).toBe('Enter your access code');
    expect(validateAccessCode('')?.accessCode).toBe('Enter your access code');
    expect(validateAccessCode('   ')?.accessCode).toBe('Enter your access code');
  });

  it('should return error when access code is wrong length', () => {
    expect(validateAccessCode('ABC123')?.accessCode).toBe('Access code must be 8 characters');
    expect(validateAccessCode('ABC123456')?.accessCode).toBe('Access code must be 8 characters');
  });

  it('should return error when access code contains invalid characters', () => {
    expect(validateAccessCode('ABC-1234')?.accessCode).toBe('Access code must only include letters a-z, and numbers 0-9');
  });

  it('should return null for valid access codes', () => {
    expect(validateAccessCode('A1BCDE23')).toBeNull();
    expect(validateAccessCode('  ABC12345  ')).toBeNull(); // trims whitespace
  });
});

describe('retrieveCaseData', () => {
  it('should return null when caseData is undefined', () => {
    const result = retrieveCaseData(undefined);
    expect(result).toBeNull();
  });

  it('should return caseData when it exists', () => {
    const mockCaseData = { divorceCaseNumber: '123' } as FinremCaseData;
    const result = retrieveCaseData(mockCaseData);
    expect(result).toEqual(mockCaseData);
  });
});

describe('getMatchingAccessCode', () => {
  const mockCaseData: FinremCaseData = {
    applicantAccessCodes: [
      {
        id: '1',
        value: {
          accessCode: 'AAAA1111',
          createdAt: '2024-01-01',
          validUntil: '2024-12-31',
          isValid: YesOrNo.YES,
        },
      },
    ],
    respondentAccessCodes: [
      {
        id: '2',
        value: {
          accessCode: 'BBBB2222',
          createdAt: '2024-01-01',
          validUntil: '2024-12-31',
          isValid: YesOrNo.YES,
        },
      },
    ],
  } as FinremCaseData;

  it('should find matching applicant access code (case insensitive)', () => {
    const result = getMatchingAccessCode(mockCaseData, 'aaaa1111');
    expect(result).not.toBeNull();
    expect(result?.match.value.accessCode).toBe('AAAA1111');
  });

  it('should find matching respondent access code (case insensitive)', () => {
    const result = getMatchingAccessCode(mockCaseData, 'bbbb2222');
    expect(result).not.toBeNull();
    expect(result?.match.value.accessCode).toBe('BBBB2222');
  });

  it('should return null when access code does not match', () => {
    const result = getMatchingAccessCode(mockCaseData, 'CCCC3333');
    expect(result).toBeNull();
  });

  it('should handle case with no access codes', () => {
    const emptyCaseData = {} as FinremCaseData;
    const result = getMatchingAccessCode(emptyCaseData, 'AAAA1111');
    expect(result).toBeNull();
  });

  it('should trim and uppercase the access code', () => {
    const result = getMatchingAccessCode(mockCaseData, '  aaaa1111  ');
    expect(result).not.toBeNull();
    expect(result?.match.value.accessCode).toBe('AAAA1111');
  });
});

describe('validateAccessCodeAgainstCase', () => {
  const createMockAccessCode = (validUntil: string, isValid: YesOrNo): AccessCodeCollection => ({
    id: '1',
    value: {
      accessCode: 'TEST1234',
      createdAt: '2024-01-01',
      validUntil,
      isValid,
    },
  });

  it('should return valid when access code is not expired and not used', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const mockAccessCode = createMockAccessCode(futureDate.toISOString(), YesOrNo.YES);
    
    const result = validateAccessCodeAgainstCase(mockAccessCode);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid when access code has expired', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const mockAccessCode = createMockAccessCode(pastDate.toISOString(), YesOrNo.YES);
    
    const result = validateAccessCodeAgainstCase(mockAccessCode);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('The access code you entered has expired. Contact the court to get a new code');
  });

  it('should return invalid when access code has already been used', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const mockAccessCode = createMockAccessCode(futureDate.toISOString(), YesOrNo.NO);
    
    const result = validateAccessCodeAgainstCase(mockAccessCode);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('The access code you entered has already been used, you should contact the court.');
  });

  it('should prioritize expiry check over usage check', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const mockAccessCode = createMockAccessCode(pastDate.toISOString(), YesOrNo.NO);
    
    const result = validateAccessCodeAgainstCase(mockAccessCode);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('The access code you entered has expired. Contact the court to get a new code');
  });
});

describe('addUserToCaseForRole', () => {
  let mockAddUsersToCase: jest.MockedFunction<(users: unknown[]) => Promise<void>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAddUsersToCase = jest.fn() as unknown as jest.MockedFunction<(users: unknown[]) => Promise<void>>;

    jest.mocked(getCaseApi).mockReturnValue({
      addUsersToCase: mockAddUsersToCase,
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
  });

  it('successfully adds user to case and logs info', async () => {
    mockAddUsersToCase.mockResolvedValue(undefined);

    await addUserToCaseForRole('12345', 'user-1', CaseRole.APPLICANT);

    expect(mockAddUsersToCase).toHaveBeenCalledWith([
      {
        case_id: '12345',
        user_id: 'user-1',
        case_role: CaseRole.APPLICANT,
      },
    ]);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Successfully added user to case',
      {
        caseId: '12345',
        userId: 'user-1',
        caseRole: CaseRole.APPLICANT,
      }
    );
  });

  it('logs error and rethrows when addUsersToCase fails', async () => {
    const error = new Error('CCD failure');
    mockAddUsersToCase.mockRejectedValue(error);

    await expect(
      addUserToCaseForRole('12345', 'user-1', CaseRole.RESPONDENT)
    ).rejects.toThrow('CCD failure');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error adding user to case',
      {
        caseId: '12345',
        userId: 'user-1',
        caseRole: CaseRole.RESPONDENT,
        error: 'CCD failure',
      }
    );
  });
});

// ─── Route handler tests ───────────────────────────────────────────────────────

const futureDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

const buildMockCaseData = (
  applicantCode = 'APPCODE1',
  respondentCode = 'RSPCODE1',
  isValid: YesOrNo = YesOrNo.YES,
  validUntil = futureDate()
): FinremCaseData =>
  ({
    applicantAccessCodes: [
      { id: '1', value: { accessCode: applicantCode, createdAt: '2024-01-01', validUntil, isValid } },
    ],
    respondentAccessCodes: [
      { id: '2', value: { accessCode: respondentCode, createdAt: '2024-01-01', validUntil, isValid } },
    ],
  } as unknown as FinremCaseData);

const buildTestApp = (sessionOverrides: Record<string, unknown> = {}) => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: false }));

  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).session = {
      user: { uid: 'user-1', accessToken: 'token' },
      save: (cb?: (err?: Error) => void) => {
        cb?.();
      },
      ...sessionOverrides,
    };
    next();
  });

  testApp.use((_req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).render = (view: string, locals?: unknown) => res.status(200).json({ view, locals });
    next();
  });

  setupEnterAccessCodeRoute(testApp);
  return testApp;
};

describe('GET /enter-access-code route handler', () => {
  it('redirects to enter-case-number when no caseNumber in session', async () => {
    const res = await request(buildTestApp()).get('/enter-access-code');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
  });

  it('renders enter-access-code view when caseNumber is in session', async () => {
    const res = await request(buildTestApp({ caseNumber: '1234567890123456' })).get('/enter-access-code');
    expect(res.status).toBe(200);
    expect(res.body.view).toBe('enter-access-code');
  });
});

describe('POST /enter-access-code route handler', () => {
  let mockAddUsersToCase: jest.MockedFunction<(users: unknown[]) => Promise<void>>;
  let mockTriggerEvent: jest.MockedFunction<(caseId: string, data: Partial<FinremCaseData>, event: string) => Promise<FinremCaseData>> = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddUsersToCase = jest.fn() as unknown as jest.MockedFunction<(users: unknown[]) => Promise<void>>;
    mockAddUsersToCase.mockResolvedValue(undefined);
    mockTriggerEvent.mockResolvedValue(buildMockCaseData());
    jest.mocked(getCaseApi).mockReturnValue({ addUsersToCase: mockAddUsersToCase, triggerEvent: mockTriggerEvent } as unknown as ReturnType<typeof getCaseApi>);
    jest.mocked(getSystemUser).mockResolvedValue({
      accessToken: 'mock-access', sub: '123', id: 'system-user',
      email: 'system@test.com', givenName: 'System', familyName: 'User', roles: ['admin'],
    } as unknown as Awaited<ReturnType<typeof getSystemUser>>);
  });

  it('redirects to enter-case-number when no caseNumber in session', async () => {
    const res = await request(buildTestApp()).post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
  });

  it('renders with validation errors for empty access code', async () => {
    const res = await request(buildTestApp({ caseNumber: '1234567890123456' }))
      .post('/enter-access-code').send({ accessCode: '' });
    expect(res.status).toBe(200);
    expect(res.body.locals.errors.accessCode).toBe('Enter your access code');
  });

  it('renders with validation errors for wrong-length access code', async () => {
    const res = await request(buildTestApp({ caseNumber: '1234567890123456' }))
      .post('/enter-access-code').send({ accessCode: 'SHORT' });
    expect(res.status).toBe(200);
    expect(res.body.locals.errors.accessCode).toBe('Access code must be 8 characters');
  });

  it('redirects to enter-case-number when caseData missing from session', async () => {
    const res = await request(buildTestApp({ caseNumber: '1234567890123456' }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
  });

  it('renders error when access code does not match case data', async () => {
    const caseData = buildMockCaseData();
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'NOMATCH1' });
    expect(res.status).toBe(200);
    expect(res.body.locals.errors.accessCode).toBe('Access code does not match case number');
  });

  it('renders error when access code has expired', async () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    const caseData = buildMockCaseData('APPCODE1', 'RSPCODE1', YesOrNo.YES, pastDate.toISOString());
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(200);
    expect(res.body.locals.errors.accessCode).toContain('expired');
  });

  it('renders error when access code has already been used', async () => {
    const caseData = buildMockCaseData('APPCODE1', 'RSPCODE1', YesOrNo.NO);
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(200);
    expect(res.body.locals.errors.accessCode).toContain('already been used');
  });

  it('redirects to dashboard on successful access code submission', async () => {
    const caseData = buildMockCaseData();
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/dashboard');
  });

  it('renders error view when addUserToCaseForRole throws', async () => {
    mockAddUsersToCase.mockRejectedValue(new Error('CCD down'));
    const caseData = buildMockCaseData();
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(200);
    expect(res.body.view).toBe('error');
  });
});

describe('invalidateAccessCode', () => {
  const mockTriggerEvent: jest.MockedFunction<(caseId: string, data: Partial<FinremCaseData>, event: string) => Promise<FinremCaseData>> = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (getCaseApi as jest.Mock).mockReturnValue({
      triggerEvent: mockTriggerEvent,
    });

    jest.mocked(getSystemUser).mockResolvedValue({
      accessToken: 'mock-access', sub: '123', id: 'system-user',
      email: 'system@test.com', givenName: 'System', familyName: 'User', roles: ['admin'],
    } as unknown as Awaited<ReturnType<typeof getSystemUser>>);
  });

  it('invalidates applicant access code and triggers applicant event', async () => {
    const caseData = buildMockCaseData('APPCODE1');
    mockTriggerEvent.mockResolvedValue(caseData);


    const result = await invalidateAccessCode(
      caseData,
      'APPCODE1',
      CaseRole.APPLICANT,
      '12345'
    );

    expect(mockTriggerEvent).toHaveBeenCalledWith(
      '12345',
      {
        applicantAccessCodes: [
          expect.objectContaining({
            value: expect.objectContaining({
              isValid: YesOrNo.NO,
            }),
          }),
        ],
      },
      EVENT_TYPE.INVALIDATE_APPLICANT_ACCESS_CODE
    );

    expect(result).toBe(caseData);
  });

  it('invalidates respondent access code and triggers respondent event', async () => {
    const caseData = buildMockCaseData('APPCODE1', 'RSPCODE1');
    mockTriggerEvent.mockResolvedValue(caseData);

    await invalidateAccessCode(
      caseData,
      'RSPCODE1',
      CaseRole.RESPONDENT,
      '12345'
    );

    expect(mockTriggerEvent).toHaveBeenCalledWith(
      '12345',
      {
        respondentAccessCodes: [
          expect.objectContaining({
            value: expect.objectContaining({
              isValid: YesOrNo.NO,
            }),
          }),
        ],
      },
      EVENT_TYPE.INVALIDATE_RESPONDENT_ACCESS_CODE
    );
  });

  it('throws and logs if triggerEvent fails', async () => {
    const caseData = buildMockCaseData();
    mockTriggerEvent.mockRejectedValue(new Error('CCD failure'));

    await expect(
      invalidateAccessCode(caseData, 'APPCODE1', CaseRole.APPLICANT, '12345')
    ).rejects.toThrow('CCD failure');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error invalidating access code',
      expect.objectContaining({
        caseId: '12345',
        caseRole: CaseRole.APPLICANT,
        error: 'CCD failure',
      })
    );
  });
});