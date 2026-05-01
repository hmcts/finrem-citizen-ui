import axios from 'axios';
import config from 'config';
import { Request, Response } from 'express';

import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { getSystemUser } from '../auth/user';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('document.controller');


export async function uploadDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const file = req.file as Express.Multer.File | undefined;

    if (!file || !file.buffer) {
      res.status(400).send('No file uploaded');
      return;
    }

    const systemUser = await getSystemUser();
    const serviceToken = await getServiceAuthToken();

    const documentApiUrl: string = config.get(
      'services.caseDocumentManagement.url'
    );

    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('caseTypeId', 'FinancialRemedyContested');
    formData.append('jurisdictionId', 'DIVORCE');
    formData.append('classification', 'PUBLIC');

    formData.append('files', file.buffer, file.originalname);

    const response = await axios.post(
      `${documentApiUrl}/cases/documents`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${systemUser.accessToken}`,
          ServiceAuthorization: serviceToken,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const href: string = response.data.documents[0]._links.self.href;
    const documentId = href.split('/').pop();

    req.session.uploadedDocumentId = documentId;

    res.redirect('/documents');
  } catch (error) {
    logger.error('Upload failed', error);
    res.status(500).send('Upload failed');
  }
}



export async function downloadDocument(
    req: Request,
    res: Response
): Promise<void> {
    const documentId = req.params.documentId as string;

    try {
        const systemUser = await getSystemUser();
        const serviceToken = await getServiceAuthToken();

        const documentApiUrl: string = config.get(
            'services.caseDocumentManagement.url'
        );

        const response = await axios.get(
            `${documentApiUrl}/cases/documents/${documentId}/binary`,
            {
                responseType: 'stream',
                headers: {
                    Authorization: `Bearer ${systemUser.accessToken}`,
                    ServiceAuthorization: serviceToken,
                    experimental: 'true',
                },
            }
        );

        const rawContentType = response.headers['content-type'];
        const contentType =
            typeof rawContentType === 'string'
                ? rawContentType
                : 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        // res.setHeader('Content-Disposition', 'attachment');
        res.setHeader('Content-Disposition', 'inline');

        response.data.pipe(res);
    } catch (error) {
        logger.error('Upload failed', error);
        res.status(500).send('Download failed');
    }
}