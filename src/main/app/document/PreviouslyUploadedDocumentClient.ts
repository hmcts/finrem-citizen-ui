import axios, { AxiosInstance } from 'axios';
import config from 'config';

import { UrlEndPoints } from '../../constants';
import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { CASE_DATA_API_URL } from '../case/case-type';
import type { UserDetails } from '../controller/AppRequest';

export class PreviouslyUploadedDocumentClient {
  client: AxiosInstance;
  BASE_URL: string = config.get(CASE_DATA_API_URL);
  constructor(private readonly user: UserDetails) {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        Authorization: `Bearer ${this.user.accessToken}`,
        ServiceAuthorization: getServiceAuthToken(),
        experimental: 'true',
      },
    });
  }

  async getPreviouslyUploadedDocuments(caseId: string, documentCollection: string): Promise<PreviouslyUploadedDocumentsResponse> {
     const response = await this.client.get(
        UrlEndPoints.PreviouslyUploadedDocuments(caseId, documentCollection),
      );
      return response.data;
  }

}

export interface PreviouslyUploadedDocumentsResponse {
  case_details: PreviouslyUploadedDocumentsCaseDetails;
  event_id: string;
}

export interface PreviouslyUploadedDocumentsCaseDetails {
  id: number;
  jurisdiction: string;
  state: string;
  version: number;
  case_type_id: string;
  created_date: Date;
  last_modified: Date;
  last_state_modified_date: Date;
  security_classification: string;
  case_data: PreviouslyUploadedDocumentsCaseData;
}

export interface PreviouslyUploadedDocumentsCaseData {
  applicantDocCollection?: PreviouslyUploadedDocument[];
  respondentDocCollection?: PreviouslyUploadedDocument[];
  fdrApplicantDocCollection?: PreviouslyUploadedDocument[];
  fdrRespondentDocCollection?: PreviouslyUploadedDocument[];
  divorceApplicantDocCollection?: PreviouslyUploadedDocument[];
  divorceRespondentDocCollection?: PreviouslyUploadedDocument[];
  hearingApplicantDocCollection?: PreviouslyUploadedDocument[];
  hearingRespondentDocCollection?: PreviouslyUploadedDocument[];
}

export interface PreviouslyUploadedDocument {
  id: string;
  value: PreviouslyUploadedDocumentValue;
}

export interface PreviouslyUploadedDocumentValue {
  DocumentLink: PreviouslyUploadedDocumentLink;
  DocumentType: string;
  DocumentFileName: string;
  DocumentDateAdded: Date;
}

export interface PreviouslyUploadedDocumentLink {
  document_url: string;
  upload_timestamp: string;
  document_filename: string;
  document_binary_url: string;
}
