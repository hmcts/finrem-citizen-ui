import { FinremCaseData } from './definition';

/**
 * Mock CCD case data for local development
 * Enable by setting MOCK_CCD=true in your environment
 */

export const MOCK_CASE_NUMBER = '1234567890123456';

export const mockCaseData: FinremCaseData = {
  // Mock access codes for testing
  applicantAccessCodes: [
    {
      id: 'mock-id-1',
      value: {
        accessCode: 'ABC12345',
        createdAt: '2026-01-01',
        validUntil: '2026-12-31', // Valid for the whole year
        isValid: 'Yes',
      },
    },
    {
      id: 'mock-id-2',
      value: {
        accessCode: 'EXPIRED1',
        createdAt: '2025-01-01',
        validUntil: '2025-03-31', // Expired
        isValid: 'Yes',
      },
    },
  ],
  respondentAccessCodes: [
    {
      id: 'mock-id-3',
      value: {
        accessCode: 'XYZ98765',
        createdAt: '2026-01-01',
        validUntil: '2026-12-31', // Valid
        isValid: 'Yes',
      },
    },
    {
      id: 'mock-id-4',
      value: {
        accessCode: 'USED0001',
        createdAt: '2026-01-01',
        validUntil: '2026-12-31',
        isValid: 'No', // Already used
      },
    },
  ],
} as FinremCaseData;

/**
 * Check if mocking is enabled via environment variable
 */
export function isMockEnabled(): boolean {
  return process.env.MOCK_CCD === 'true';
}

/**
 * Get mock case data by case number
 * Returns mock data if case number matches, otherwise throws error
 */
export function getMockCaseData(caseNumber: string): FinremCaseData {
  const normalizedCaseNumber = caseNumber.replace(/-/g, '');
  
  if (normalizedCaseNumber === MOCK_CASE_NUMBER) {
    return mockCaseData;
  }
  
  throw new Error(`Mock case not found for case number: ${caseNumber}`);
}
