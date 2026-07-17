import { CaseRole } from '../../app/case/definition';

export function hasValidCaseRole(caseRole: CaseRole | undefined): boolean {
  if (!caseRole) {
    return false;
  }

  return [CaseRole.APPLICANT, CaseRole.RESPONDENT].includes(caseRole);
}
