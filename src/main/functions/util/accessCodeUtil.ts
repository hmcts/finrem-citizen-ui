import { AccessCodeCollection, CaseRole, FinremCaseData, YesOrNo } from '../../app/case/definition';

export interface AccessCodeError {
  accessCode?: string;
}

export type EmailField = 'applicantEmail' | 'respondentEmail';
export type AccessCodeField = 'applicantAccessCodes' | 'respondentAccessCodes';
export type MatchingAccessCodeResult =
  | { match: AccessCodeCollection; role: CaseRole }
  | { errors: AccessCodeError };

export function validateAccessCodeFormat(accessCode: string | undefined): AccessCodeError | null {
  const errors: AccessCodeError = {};

  if (!accessCode || !accessCode.trim()) {
    errors.accessCode = 'Enter your access code';
    return errors;
  }

  const trimmedAccessCode = accessCode.trim();

  if (trimmedAccessCode.length !== 8) {
    errors.accessCode = 'Access code must be 8 characters';
    return errors;
  }

  const formatRegex = /^[a-zA-Z0-9]+$/;
  if (!formatRegex.test(trimmedAccessCode)) {
    errors.accessCode = 'Access code must only include letters a-z, and numbers 0-9';
    return errors;
  }

  return null;
}

export function findMatchingAccessCode(
  caseAccessCodesByRole: Record<CaseRole, AccessCodeCollection[]>,
  enteredAccessCode: string
): MatchingAccessCodeResult {
  for (const role in caseAccessCodesByRole) {
    const codes = caseAccessCodesByRole[role as CaseRole];
    const match = codes.find(ac => ac.value?.accessCode?.toUpperCase() === enteredAccessCode);

    if (!match) {
      continue;
    }

    if (match.value.isValid === YesOrNo.NO) {
      return { errors: { accessCode: 'The access code you entered has already been used, you should contact the court.' } };
    }

    return { match, role: role as CaseRole };
  }

  return { errors: { accessCode: 'Access code does not match case number' } };
}

export function getCaseAccessCodesByRole(caseData: FinremCaseData): Record<CaseRole, AccessCodeCollection[]> {
  return {
    [CaseRole.APPLICANT]: caseData.applicantAccessCodes || [],
    [CaseRole.RESPONDENT]: caseData.respondentAccessCodes || [],
  };
}

export function getEmailCaseField(caseRole: CaseRole): EmailField {
  return caseRole === CaseRole.APPLICANT ? 'applicantEmail' : 'respondentEmail';
}

export function getAccessCodeCaseField(caseRole: CaseRole): AccessCodeField {
  return caseRole === CaseRole.APPLICANT ? 'applicantAccessCodes' : 'respondentAccessCodes';
}
