import { describe, expect, it } from '@jest/globals';

import { validateCaseNumber } from '../../../main/routes/enter-case-number';

describe('Enter Case Number Validation', () => {
  describe('Required validation', () => {
    it('should return error when case number is undefined', () => {
      const result = validateCaseNumber(undefined);
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Enter case number');
    });

    it('should return error when case number is empty string', () => {
      const result = validateCaseNumber('');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Enter case number');
    });

    it('should return error when case number is only whitespace', () => {
      const result = validateCaseNumber('   ');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Enter case number');
    });
  });

  describe('Length validation', () => {
    it('should return error when case number is less than 16 characters', () => {
      const result = validateCaseNumber('123456789012345');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be between 16 and 20 characters');
    });

    it('should return error when case number is more than 20 characters', () => {
      const result = validateCaseNumber('123456789012345678901');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be between 16 and 20 characters');
    });

    it('should return null when case number is exactly 16 characters', () => {
      const result = validateCaseNumber('1234567890123456');
      expect(result).toBeNull();
    });

    it('should return null when case number is exactly 20 characters', () => {
      const result = validateCaseNumber('12345678901234567890');
      expect(result).toBeNull();
    });

    it('should return null when case number is 18 characters (within range)', () => {
      const result = validateCaseNumber('123456789012345678');
      expect(result).toBeNull();
    });
  });

  describe('Format validation', () => {
    it('should return null with valid case number with hyphens', () => {
      const result = validateCaseNumber('1234-5678-0123-4567');
      expect(result).toBeNull();
    });

    it('should return error with letters in case number', () => {
      const result = validateCaseNumber('1234-5678-ABCD-4567');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must only include numbers 0 to 9 and special characters such as hyphens');
    });

    it('should return error with special characters other than hyphens', () => {
      const result = validateCaseNumber('1234-5678-0123@4567');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must only include numbers 0 to 9 and special characters such as hyphens');
    });

    it('should return error with spaces in case number', () => {
      const result = validateCaseNumber('1234 5678 0123 4567');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must only include numbers 0 to 9 and special characters such as hyphens');
    });

    it('should return null with only numbers (no hyphens)', () => {
      const result = validateCaseNumber('1234567890123456');
      expect(result).toBeNull();
    });

    it('should return null with mixed numbers and hyphens', () => {
      const result = validateCaseNumber('12-34-56-78-90-12');
      expect(result).toBeNull();
    });
  });

  describe('Trimming behavior', () => {
    it('should trim leading and trailing whitespace', () => {
      const result = validateCaseNumber('  1234567890123456  ');
      expect(result).toBeNull();
    });

    it('should return error if trimmed length is invalid', () => {
      const result = validateCaseNumber('  12345  ');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be between 16 and 20 characters');
    });
  });
});
