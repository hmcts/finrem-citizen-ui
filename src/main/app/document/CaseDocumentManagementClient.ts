import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from 'config';
import { Response } from 'express';
import FormData from 'form-data';

import { UrlEndPoints } from '../../common-constants';
import { generateRenamedFilename, shouldAutoRename, toDocumentTypeKey } from '../../functions/util/documentUtil';
import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { CASE_DOCUMENT_MANAGEMENT_SERVICE_URL, CASE_TYPE, JURISDICTION } from '../case/case-type';
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
        experimental: 'true',
      },
    });
  }

  async create({
    files,
    classification,
    documentType,
    caseUserName,
  }: {
    files: UploadedFiles;
    classification: Classification;
    documentType?: string;
    caseUserName?: string;
  }): Promise<DocumentManagementFile[]> {
    const formData = new FormData();
    formData.append('caseTypeId', CASE_TYPE);
    formData.append('jurisdictionId', JURISDICTION);
    formData.append('classification', classification);

    for (const [, file] of Object.entries(files)) {
      // Determine the filename to use when uploading
      let uploadFilename = file.originalname;
      
      // If documentType is provided, check if it should be auto-renamed
      if (documentType) {
        const documentTypeKey = toDocumentTypeKey(documentType);
        if (shouldAutoRename(documentTypeKey)) {
          uploadFilename = generateRenamedFilename(documentTypeKey, file.originalname, caseUserName);
        }
      }
      
      formData.append('files', file.buffer, uploadFilename);
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

  async getDocument(res: Response, documentId: string): Promise<void> {
    const response = await this.client.get(
      UrlEndPoints.GetDocument(documentId),
      { responseType: 'stream' }
    );

    const contentType =
      typeof response.headers['content-type'] === 'string'
        ? response.headers['content-type']
        : 'application/octet-stream';

    const disposition = response.headers['content-disposition'];

    res.setHeader('Content-Type', contentType);

    if (disposition) {
      res.setHeader('Content-Disposition', disposition);
    }

    response.data.pipe(res);
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