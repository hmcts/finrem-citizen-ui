import { Response } from 'express';
import { v4 as generateUuid } from 'uuid';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../auth/user';
import { getCaseApi } from '../case/case-api';
import { CITIZEN_APPLICANT_DOCUMENT, CITIZEN_RESPONDENT_DOCUMENT, EVENT_TYPE } from '../case/case-type';
import { CaseRole, CitizenUploadDocument, CitizenUploadDocumentType, ListValue, YesOrNo } from '../case/definition';
import type { AppRequest, UserDetails } from '../controller/AppRequest';
import {
  CaseDocumentManagementClient,
  Classification
} from './CaseDocumentManagementClient';
import {
  PreviouslyUploadedDocumentClient,
  PreviouslyUploadedDocumentsResponse
} from './PreviouslyUploadedDocumentClient';

export class DocumentManagerController {
    constructor(private readonly logger: LoggerInstance) { }

    public async uploadDocumentToEvidenceStore(
        req: AppRequest,
        documentType: CitizenUploadDocumentType
    ): Promise<void> {
        this.logger.info('Uploading document via CDAM (session only)');

        if (!req.files?.length || req.headers.accept?.includes('application/json')) {
            throw new Error('No files were uploaded');
        }

        const user = req.session.user;
        if (!user) {
            throw new Error('No user in session');
        }

        const filesCreated = await this.getApiClient(user).create({
            files: req.files,
            classification: Classification.Public,
        });

        const newUploads: ListValue<Partial<CitizenUploadDocument> | null>[] =
            filesCreated.map(file => ({
                id: generateUuid(),
                value: {
                    DocumentFileName: file.originalDocumentName,
                    DocumentType: documentType,
                    DocumentLink: {
                        document_url: file._links.self.href,
                        document_filename: file.originalDocumentName,
                        document_binary_url: file._links.binary.href,
                    },
                },
            }));

        if (!req.session.documents) {
            req.session.documents = {
                documentDetails: [],
                isFinancialDisputeResolution: false,
            };
        }

        req.session.documents.documentDetails = [
            ...(req.session.documents.documentDetails ?? []),
            ...newUploads,
        ];

        this.logger.info('Documents stored in session', {
            count: req.session.documents.documentDetails.length,
        });
    }

    public async LinkDocumentsToCase(req: AppRequest): Promise<void> {
        const user = req.session.user;
        if (!user) {
            throw new Error('No user in session');
        }
        const caseRole = user.caseRole;

        if (!req.session.caseNumber) {
            throw new Error('No caseNumber in session');
        }

        const documents = req.session.documents?.documentDetails ?? [];
        const isFDR = req.session.documents?.isFinancialDisputeResolution ?? false;

        if (!documents.length) {
            throw new Error('No documents in session to send');
        }

        const documentsKey =
            caseRole === CaseRole.APPLICANT
                ? CITIZEN_APPLICANT_DOCUMENT
                : CITIZEN_RESPONDENT_DOCUMENT;

        const updatedDocuments = documents.map(doc => ({
            ...doc,
            value: {
                ...doc.value,
                isFDR: isFDR ? YesOrNo.YES : YesOrNo.NO,
            },
        }));

        const systemUser = await getSystemUser();
        const caseworkerUserApi = getCaseApi(systemUser, this.logger);

        req.session.caseData = await caseworkerUserApi.triggerEvent(
            req.session.caseNumber,
            {
                [documentsKey]: updatedDocuments,
            },
            caseRole === CaseRole.APPLICANT
                ? EVENT_TYPE.APPLICANT_UPLOAD_DOCUMENT
                : EVENT_TYPE.RESPONDENT_UPLOAD_DOCUMENT
        );

        delete req.session.documents;

        this.logger.info('Document collection sent to CCD', {
            documentCount: updatedDocuments.length,
            isFDR,
        });
    }

    public async downloadDocument(
        req: AppRequest,
        res: Response,
        documentId: string,
        caseId: string
    ): Promise<void> {
        const user = req.session.user;

        if (!user) {
            throw new Error('No user in session');
        }

    if (!req.session.caseNumber || req.session.caseNumber !== caseId) {
      res.status(403).send('Forbidden');
      return;
    }
    const systemUser = await getSystemUser();
    await this.getApiClient(systemUser).getDocument(res, documentId);
  }

  public async previouslyUploadedDocuments(
    req: AppRequest,
    res: Response,
    caseId: string
  ): Promise<PreviouslyUploadedDocumentsResponse> {
    const user = req.session.user;

    if (!user) {
      throw new Error('No user in session');
    }

    if (!req.session.caseNumber || req.session.caseNumber !== caseId) {
      res.status(403).send('Forbidden');
      throw new Error('Forbidden');
    }

    const caseRole = req.session.user?.caseRole;
    this.logger.info('is Applicant or respondent', caseRole);

    const documentCollection = this.getDocumentCollection(user.caseRole as string);

    const systemUser = await getSystemUser();
    const previouslyUploadedDocumentClient = new PreviouslyUploadedDocumentClient(systemUser);

    return previouslyUploadedDocumentClient.getPreviouslyUploadedDocuments(caseId, documentCollection);
  }

  private getApiClient(user: UserDetails): CaseDocumentManagementClient {
    return new CaseDocumentManagementClient(user);
  }

  private  getDocumentCollection(caseRole: string) {
    if (caseRole === CaseRole.APPLICANT) {
      return EVENT_TYPE.APPLICANT_UPLOAD_DOCUMENT;
    } else if (caseRole === CaseRole.RESPONDENT) {
      return EVENT_TYPE.RESPONDENT_UPLOAD_DOCUMENT;
    }

    throw new Error(`Unsupported case role: ${caseRole}`);
  }
}
