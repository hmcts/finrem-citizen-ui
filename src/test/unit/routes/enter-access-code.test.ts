import { AccessCodeCollection, FinremCaseData, YesOrNo } from '../../../main/app/case/definition';
import {
  getMatchingAccessCode,
  retrieveCaseData,
  validateAccessCode,
  validateAccessCodeAgainstCase,
} from '../../../main/routes/enter-access-code';

describe('Enter Access Code Validation', () => {
  describe('Required validation', () => {
    it('should return error when access code is undefined', () => {
      const result = validateAccessCode(undefined);
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Enter your access code');
    });

    it('should return error when access code is empty string', () => {
      const result = validateAccessCode('');
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Enter your access code');
    });

    it('should return error when access code is only whitespace', () => {
      const result = validateAccessCode('   ');
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Enter your access code');
    });
  });

  describe('Length validation', () => {
    it('should return error when access code is less than 8 characters', () => {
      const result = validateAccessCode('ABC123');
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Access code must be 8 characters');
    });

    it('should return error when access code is more than 8 characters', () => {
      const result = validateAccessCode('ABC123456');
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Access code must be 8 characters');
    });

    it('should return null when access code is exactly 8 characters', () => {
      const result = validateAccessCode('ABC12345');
      expect(result).toBeNull();
    });
  });

  describe('Format validation', () => {
    it('should return error when access code contains special characters', () => {
      const result = validateAccessCode('ABC-1234');
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Access code must only include letters a-z, and numbers 0-9');
    });

    it('should return error when access code contains spaces', () => {
      const result = validateAccessCode('ABC 1234');
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Access code must only include letters a-z, and numbers 0-9');
    });

    it('should return error when access code contains symbols', () => {
      const result = validateAccessCode('ABC@1234');
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Access code must only include letters a-z, and numbers 0-9');
    });

    it('should return null with valid alphanumeric code (uppercase)', () => {
      const result = validateAccessCode('A1BCDE23');
      expect(result).toBeNull();
    });

    it('should return null with valid alphanumeric code (lowercase)', () => {
      const result = validateAccessCode('a1bcde23');
      expect(result).toBeNull();
    });

    it('should return null with valid alphanumeric code (mixed case)', () => {
      const result = validateAccessCode('A1bCdE23');
      expect(result).toBeNull();
    });

    it('should return null with only letters', () => {
      const result = validateAccessCode('ABCDEFGH');
      expect(result).toBeNull();
    });

    it('should return null with only numbers', () => {
      const result = validateAccessCode('12345678');
      expect(result).toBeNull();
    });
  });

  describe('Trimming behavior', () => {
    it('should trim leading and trailing whitespace', () => {
      const result = validateAccessCode('  ABC12345  ');
      expect(result).toBeNull();
    });

    it('should return error if trimmed length is invalid', () => {
      const result = validateAccessCode('  ABC  ');
      expect(result).not.toBeNull();
      expect(result?.accessCode).toBe('Access code must be 8 characters');
    });
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
    expect(result?.value.accessCode).toBe('AAAA1111');
  });

  it('should find matching respondent access code (case insensitive)', () => {
    const result = getMatchingAccessCode(mockCaseData, 'bbbb2222');
    expect(result).not.toBeNull();
    expect(result?.value.accessCode).toBe('BBBB2222');
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
    expect(result?.value.accessCode).toBe('AAAA1111');
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
