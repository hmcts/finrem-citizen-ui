export const caseDataFactory = {
  generateDigits: (n: number): string => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join(''),

  formatCaseNumber: (digits: string): string =>
    `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12, 16)}`,

  VALID_CASE: '1773677683810798',
};

export const ErrorMessages = {
  EMPTY: 'Enter your case number',
  INVALID_LENGTH: 'Case number must be between 16 and 20 characters',
  INVALID_CHARS: 'Case number must only include numbers 0 to 9 and special characters such as hyphens',
  NOT_FOUND: 'We cannot find that case number, Enter the case number that you received from the court',
};
