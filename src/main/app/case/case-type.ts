import { CaseType } from './definition';
export const CASE_TYPE: string = process.env.CASE_TYPE || CaseType.CONTESTED;
export const enum EVENT_TYPE {
  INVALIDATE_APPLICANT_ACCESS_CODE = 'CUI_invalidateApplicantAccessCode',
  INVALIDATE_RESPONDENT_ACCESS_CODE = 'CUI_invalidateRespondentAccessCode',
  APPLICANT_UPLOAD_DOCUMENT = 'CUI_applicantUploadDocuments',
  RESPONDENT_UPLOAD_DOCUMENT = 'CUI_respondentUploadDocuments',
}
export const JURISDICTION = 'DIVORCE';
export const CASE_DOCUMENT_MANAGEMENT_SERVICE_URL = 'services.caseDocumentManagement.url';
export const CITIZEN_APPLICANT_DOCUMENT = 'citizenApplicantDocument';
export const CITIZEN_RESPONDENT_DOCUMENT = 'citizenRespondentDocument';