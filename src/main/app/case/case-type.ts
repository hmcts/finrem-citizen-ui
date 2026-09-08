import { CaseType } from './definition';
export const CASE_TYPE: string = process.env.CASE_TYPE || CaseType.CONTESTED;
export const enum EVENT_TYPE {
  LINK_APPLICANT_TO_CASE = 'CUI_linkApplicantToCase',
  LINK_RESPONDENT_TO_CASE = 'CUI_linkRespondentToCase',
  APPLICANT_UPLOAD_DOCUMENT = 'CUI_applicantUploadDocuments',
  RESPONDENT_UPLOAD_DOCUMENT = 'CUI_respondentUploadDocuments',
}
export const JURISDICTION = 'DIVORCE';
export const CASE_DOCUMENT_MANAGEMENT_SERVICE_URL = 'services.caseDocumentManagement.url';
export const CITIZEN_APPLICANT_DOCUMENT = 'citizenApplicantDocument';
export const CITIZEN_RESPONDENT_DOCUMENT = 'citizenRespondentDocument';
export const CASE_DATA_API_URL = 'services.case.url';
