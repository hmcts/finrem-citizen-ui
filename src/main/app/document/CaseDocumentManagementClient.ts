import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from 'config';
import FormData from 'form-data';

import { UrlEndPoints } from '../../common-constants';
import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { CASE_DOCUMENT_MANAGEMENT_SERVICE_URL,CASE_TYPE, JURISDICTION } from '../case/case-type';
import type { UserDetails } from '../controller/AppRequest';

export class CaseDocumentManagementClient {
  client: AxiosInstance;
  BASE_URL: string = config.get(CASE_DOCUMENT_MANAGEMENT_SERVICE_URL);

  constructor(private readonly user: UserDetails) {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        Authorization: `Bearer ${this.user.accessToken}`,
        ServiceAuthorization: getServiceAuthToken(),
      },
    });
  }

  async create({
    files,
    classification,
  }: {
    files: UploadedFiles;
    classification: Classification;
  }): Promise<DocumentManagementFile[]> {
    const formData = new FormData();
    formData.append('caseTypeId', CASE_TYPE);
    formData.append('jurisdictionId', JURISDICTION);
    formData.append('classification', classification);

    for (const [, file] of Object.entries(files)) {
      formData.append('files', file.buffer, file.originalname);
    }

    const response: AxiosResponse<CaseDocumentManagementResponse> = await this.client.post(
      UrlEndPoints.UploadDocument,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return response.data?.documents || [];
  }
}

interface CaseDocumentManagementResponse {
  documents: DocumentManagementFile[];
}

export interface DocumentManagementFile {
  size: number;
  mimeType: string;
  originalDocumentName: string;
  modifiedOn: string;
  createdOn: string;
  classification: Classification;
  _links: {
    self: { href: string };
    binary: { href: string };
    thumbnail: { href: string };
  };
}

export type UploadedFiles =
  | {
      [fieldname: string]: Express.Multer.File[];
    }
  | Express.Multer.File[];


export enum Classification {
  Private = 'PRIVATE',
  Restricted = 'RESTRICTED',
  Public = 'PUBLIC',
}