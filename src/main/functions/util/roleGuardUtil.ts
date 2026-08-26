import { CaseRole } from '../../app/case/definition';

const PROFESSIONAL_IDAM_ROLE_PATTERNS: RegExp[] = [/caseworker/i, /solicitor/i];

export function hasValidCaseRole(caseRole: CaseRole | undefined): boolean {
  if (!caseRole) {
    return false;
  }

  return [CaseRole.APPLICANT, CaseRole.RESPONDENT].includes(caseRole);
}

export function isProfessionalUser(userRoles: string[] = []): boolean {
  return userRoles.some(role => PROFESSIONAL_IDAM_ROLE_PATTERNS.some(pattern => pattern.test(role)));
}
