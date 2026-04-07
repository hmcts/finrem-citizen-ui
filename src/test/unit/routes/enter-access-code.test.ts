import { describe } from '@jest/globals';

import { getSystemUser } from '../../../main/app/auth/user';
import { getCaseApi } from '../../../main/app/case/case-api';
import {
  AccessCodeCollection,
  CaseRole,
  FinremCaseData,
  YesOrNo,
} from '../../../main/app/case/definition';
import {
  addUserToCaseForRole,
  getMatchingAccessCode,
  retrieveCaseData,
  validateAccessCode,
  validateAccessCodeAgainstCase,
} from '../../../main/routes/enter-access-code';

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
  let mockAddUsersToCase: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAddUsersToCase = jest.fn();

    (getCaseApi as jest.Mock).mockReturnValue({
      addUsersToCase: mockAddUsersToCase,
    });

    (getSystemUser as jest.Mock).mockResolvedValue({
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