import { Response } from 'express';
import { v4 as generateUuid } from 'uuid';
import { LoggerInstance } from 'winston';

import { HTTPError } from '../../HttpError';
import { getSystemUser } from '../auth/user';
import { getCaseApi } from '../case/case-api';
import { CITIZEN_APPLICANT_DOCUMENT, CITIZEN_RESPONDENT_DOCUMENT, EVENT_TYPE } from '../case/case-type';
import { CaseRole, CitizenUploadDocument, CitizenUploadDocumentType, ListValue } from '../case/definition';
import type { AppRequest, UserDetails } from '../controller/AppRequest';
import { CaseDocumentManagementClient, Classification, type UploadedFiles } from './CaseDocumentManagementClient';

const PASSWORD_PROTECTED_DOCUMENT_ERROR = 'Password protected documents cannot be uploaded';
const PDF_SIGNATURE = Buffer.from('%PDF');
const PDF_ENCRYPTION_MARKER = Buffer.from('/Encrypt');
const OLE_COMPOUND_FILE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const ENCRYPTION_INFO_STREAM = Buffer.from('EncryptionInfo', 'utf16le');
const ENCRYPTED_PACKAGE_STREAM = Buffer.from('EncryptedPackage', 'utf16le');
const ZIP_LOCAL_FILE_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const ZIP_CENTRAL_DIRECTORY_FILE_HEADER = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
const ZIP_ENCRYPTED_FLAG = 0x0001;

export class DocumentManagerController {
    constructor(private readonly logger: LoggerInstance) { }

    public async uploadDocumentToEvidenceStore(
        req: AppRequest,
        documentType: CitizenUploadDocumentType
    ): Promise<void> {
        this.logger.info('Uploading document via CDAM (session only)');

        const uploadedFiles = this.getUploadedFiles(req.files);

        if (!uploadedFiles.length || req.headers.accept?.includes('application/json')) {
            throw new Error('No files were uploaded');
        }

        if (uploadedFiles.some(file => this.isPasswordProtected(file))) {
            throw new HTTPError(PASSWORD_PROTECTED_DOCUMENT_ERROR, 400);
        }

        const user = req.session.user;
        if (!user) {
            throw new Error('No user in session');
        }

        const filesCreated = await this.getApiClient(user).create({
            files: uploadedFiles,
            classification: Classification.Public,
        });

        const newUploads: ListValue<Partial<CitizenUploadDocument> | null>[] =
            filesCreated.map(file => ({
                id: generateUuid(),
                value: {
                    DocumentComment: 'Uploaded by applicant',
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

        if (!documents.length) {
            throw new Error('No documents in session to send');
        }

        const documentsKey =
            caseRole === CaseRole.APPLICANT
                ? CITIZEN_APPLICANT_DOCUMENT
                : CITIZEN_RESPONDENT_DOCUMENT;

        const systemUser = await getSystemUser();
        const caseworkerUserApi = getCaseApi(systemUser, this.logger);

        req.session.caseData = await caseworkerUserApi.triggerEvent(
            req.session.caseNumber,
            {
                [documentsKey]: documents,
            },
            caseRole === CaseRole.APPLICANT
                ? EVENT_TYPE.APPLICANT_UPLOAD_DOCUMENT
                : EVENT_TYPE.RESPONDENT_UPLOAD_DOCUMENT
        );

        delete req.session.documents;

        this.logger.info('Document collection sent to CCD');
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

        await this.getApiClient(user).getDocument(res, documentId);
    }

    private getApiClient(user: UserDetails): CaseDocumentManagementClient {
        return new CaseDocumentManagementClient(user);
    }

    private getUploadedFiles(files: UploadedFiles | undefined): Express.Multer.File[] {
        if (!files) {
            return [];
        }

        if (Array.isArray(files)) {
            return files;
        }

        return Object.values(files).flat();
    }

    private isPasswordProtected(file: Express.Multer.File): boolean {
        if (!file.buffer?.length) {
            return false;
        }

        return (
            this.isEncryptedPdf(file.buffer) ||
            this.isEncryptedOfficePackage(file.buffer) ||
            this.isEncryptedZipArchive(file.buffer)
        );
    }

    private isEncryptedPdf(buffer: Buffer): boolean {
        return this.startsWith(buffer, PDF_SIGNATURE) && buffer.includes(PDF_ENCRYPTION_MARKER);
    }

    private isEncryptedOfficePackage(buffer: Buffer): boolean {
        return (
            this.startsWith(buffer, OLE_COMPOUND_FILE_SIGNATURE) &&
            buffer.includes(ENCRYPTION_INFO_STREAM) &&
            buffer.includes(ENCRYPTED_PACKAGE_STREAM)
        );
    }

    private isEncryptedZipArchive(buffer: Buffer): boolean {
        if (!this.startsWith(buffer, ZIP_LOCAL_FILE_HEADER)) {
            return false;
        }

        return (
            this.hasZipHeaderWithEncryptedFlag(buffer, ZIP_LOCAL_FILE_HEADER, 6) ||
            this.hasZipHeaderWithEncryptedFlag(buffer, ZIP_CENTRAL_DIRECTORY_FILE_HEADER, 8)
        );
    }

    private hasZipHeaderWithEncryptedFlag(
        buffer: Buffer,
        signature: Buffer,
        flagOffset: number
    ): boolean {
        let offset = 0;

        while (offset <= buffer.length - signature.length) {
            const headerIndex = buffer.indexOf(signature, offset);

            if (headerIndex === -1) {
                return false;
            }

            const flagIndex = headerIndex + flagOffset;
            if (flagIndex + 2 <= buffer.length) {
                const flags = buffer.readUInt16LE(flagIndex);

                if ((flags & ZIP_ENCRYPTED_FLAG) === ZIP_ENCRYPTED_FLAG) {
                    return true;
                }
            }

            offset = headerIndex + signature.length;
        }

        return false;
    }

    private startsWith(buffer: Buffer, signature: Buffer): boolean {
        return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature);
    }
}
