import { CaseType } from './definition';
export const CASE_TYPE: string = process.env.CASE_TYPE || CaseType.CONTESTED;
export const enum EVENT_TYPE {
  INVALIDATE_APPLICANT_ACCESS_CODE = 'CUI_invalidateApplicantAccessCode',
  INVALIDATE_RESPONDENT_ACCESS_CODE = 'CUI_invalidateRespondentAccessCode',
}
export const JURISDICTION = 'DIVORCE';