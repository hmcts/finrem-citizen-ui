import { validateAccessCode } from '../../../main/routes/enter-access-code';

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
