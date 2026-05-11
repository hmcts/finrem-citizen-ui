import type { Response } from 'express';
import { LoggerInstance } from 'winston';

import type { AppRequest, UserDetails } from '../controller/AppRequest';
import { CaseDocumentManagementClient, Classification } from './CaseDocumentManagementClient';

export class DocumentManagerController {
    constructor(private readonly logger: LoggerInstance) { }

    public async post(req: AppRequest, _res: Response): Promise<void> {
        this.logger.info('Uploading document via CDAM');

        if (!req.files?.length || req.headers.accept?.includes('application/json')) {
            throw new Error('No files were uploaded');
        }

        const filesCreated = await this.getApiClient(req.session.user).create({
            files: req.files,
            classification: Classification.Public,
        });


        // remove after testing
        req.session.uploadedDocuments = filesCreated.map(
            file => file._links.binary.href
        );


        this.logger.info('Document upload successful', {
            filesCreated: filesCreated.length,
        });
    }

    private getApiClient(user: UserDetails): CaseDocumentManagementClient {
        return new CaseDocumentManagementClient(user);
    }
}