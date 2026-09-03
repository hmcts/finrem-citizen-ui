import { randomUUID } from 'crypto';
import { Application, Request, Response } from 'express';
import { promises as fs } from 'fs';
import multer from 'multer';
import { tmpdir } from 'os';
import path from 'path';
import { LoggerInstance } from 'winston';

import { CitizenUploadDocumentType } from '../../app/case/definition';
import { AppRequest } from '../../app/controller/AppRequest';
import { DocumentManagerController } from '../../app/document/DocumentManagerController';
import { resolveHomeUrl } from '../../functions/util/homePageUtil';
import { RouteNames } from '../../constants';
import {
  FILE_UPLOAD_MAX_SIZE_BYTES,
  FILE_UPLOAD_MAX_SIZE_LABEL,
  FileUploadInputFieldNames,
  ONE_MEGABYTE_IN_BYTES,
} from '../../constants/file-upload';
import { FILE_VALIDATION_ERRORS, validateUploadedFile } from '../../functions/util/uploadValidation';
import { oidcMiddleware } from '../../middleware';
import { GENERAL_UPLOAD_DOCUMENT_REDIRECT_URL } from '../../steps/general-upload-sequence';

export default function (app: Application): void {
  const logger: LoggerInstance = console as unknown as LoggerInstance;
  app.get(RouteNames.basePath, oidcMiddleware, async (req, res, next) => {
    if (req.originalUrl === RouteNames.dashboard) {
      return next();
    }

    res.redirect(resolveHomeUrl(req.session));
  });

  const upload = multer({
    storage: multer.diskStorage({
      destination: tmpdir(),
      filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: FILE_UPLOAD_MAX_SIZE_BYTES,
    },
  });

  // Allow a small buffer above max file size to account for multipart encoding overhead
  // (boundaries, field names, headers) so a file exactly at the limit is not wrongly rejected.
  const MAX_UPLOAD_BYTES = FILE_UPLOAD_MAX_SIZE_BYTES + ONE_MEGABYTE_IN_BYTES;

  // Reject oversized uploads using the Content-Length header BEFORE Multer reads the body.
  function checkContentLength(req: Request, res: Response, next: (error?: Error) => void): void {
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > MAX_UPLOAD_BYTES) {
      const documentType = (req.query.documentType as string) || '';
      const returnUrl = GENERAL_UPLOAD_DOCUMENT_REDIRECT_URL;
      logger.warn('Upload rejected by Content-Length pre-check', { contentLength });
      return redirectWithError(req, res, next, documentType, returnUrl, FILE_VALIDATION_ERRORS.TOO_LARGE);
    }
    next();
  }

  function getUploadedFiles(req: Request): Express.Multer.File[] | undefined {
    return req.file ? [req.file] : undefined;
  }

  async function cleanupUploadedFiles(files: Express.Multer.File[] | undefined): Promise<void> {
    await Promise.all((files ?? [])
      .filter((file): file is Express.Multer.File => !!file?.path)
      .map(async file => {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          logger.warn('Failed to remove temporary upload file', {
            filePath: file.path,
            error,
          });
        }
      }));
  }

  const documentController = new DocumentManagerController(logger);

  app.post(
    RouteNames.documentUpload,
    oidcMiddleware,
    checkContentLength,
    upload.single(FileUploadInputFieldNames.file),
    (err: Error, req: Request, res: Response, next: (error?: Error) => void) => {
      if (err) {
        const documentType = req.body.documentType as string;
        const returnUrl = GENERAL_UPLOAD_DOCUMENT_REDIRECT_URL;

        // Handle Multer-specific errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            logger.warn('File size limit exceeded', {
              fieldname: err.field,
              limit: FILE_UPLOAD_MAX_SIZE_LABEL,
            });
            return redirectWithError(
              req,
              res,
              next,
              documentType,
              returnUrl,
              FILE_VALIDATION_ERRORS.TOO_LARGE
            );
          }

          // Handle other Multer errors
          logger.error('Multer error', { code: err.code, field: err.field });
          return redirectWithError(
            req,
            res,
            next,
            documentType,
            returnUrl,
            FILE_VALIDATION_ERRORS.UPLOAD_FAILED
          );
        }

        // Pass non-Multer errors to next error handler
        return next(err);
      }
      next();
    },
    async (req: Request, res: Response, next: (error?: Error) => void) => {
      try {
        const documentType = req.body.documentType as string;
        const returnUrl = GENERAL_UPLOAD_DOCUMENT_REDIRECT_URL;
        const uploadedFiles = getUploadedFiles(req);

        // Validate uploaded file
        const validationError = await validateUploadedFile(uploadedFiles);
        if (validationError) {
          return redirectWithError(req, res, next, documentType, returnUrl, validationError);
        }

        // documentType may already be an enum value (e.g. "Bank statements")
        // or kebab-case (e.g. "bank-statements"). Resolve to the enum value.
        const isEnumValue = (Object.values(CitizenUploadDocumentType) as string[]).includes(documentType);
        const documentTypeKey = documentType
          .toUpperCase()
          .replace(/-/g, '_');

        const selectedType = isEnumValue
          ? (documentType as CitizenUploadDocumentType)
          : CitizenUploadDocumentType[
            documentTypeKey as keyof typeof CitizenUploadDocumentType
          ];

        try {
          await documentController.uploadDocumentToEvidenceStore(
            req as unknown as AppRequest,
            selectedType
          );
        } catch (error) {
          // Handle upload processing errors
          logger.error('Error uploading document', { error });
          return redirectWithError(req, res, next, documentType, returnUrl, FILE_VALIDATION_ERRORS.UPLOAD_FAILED);
        }

        await cleanupUploadedFiles(uploadedFiles);

        // Clear errors on successful upload
        if (req.session.uploadErrors) {
          delete req.session.uploadErrors[documentType];
          if (Object.keys(req.session.uploadErrors).length === 0) {
            delete req.session.uploadErrors;
          }
        }

        req.session.save((err) => {
          if (err) {
            return next(err);
          }
          res.redirect(returnUrl);
        });
      } catch (error) {
        await cleanupUploadedFiles(getUploadedFiles(req));
        next(error);
      }
    }
  );

  function redirectWithError(
    req: Request,
    res: Response,
    next: (error?: Error) => void,
    documentType: string,
    returnUrl: string,
    errorMessage: string
  ): void {
    void cleanupUploadedFiles(getUploadedFiles(req));

    // Store error in session
    if (!req.session.uploadErrors) {
      req.session.uploadErrors = {};
    }
    req.session.uploadErrors[documentType] = errorMessage;

    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect(returnUrl);
    });
  }

  app.delete(
    RouteNames.documentRemove,
    oidcMiddleware,
    (req, res, next) => {
      try {
        const appReq = req as AppRequest;
        const { fileId } = req.params;

        if (!appReq.session.documents?.documentDetails) {
          return res.json({ success: true, documents: [] });
        }

        appReq.session.documents.documentDetails =
          appReq.session.documents.documentDetails.filter(
            doc => doc.id !== fileId
          );

        logger.info('Document removed from session', { fileId });

        res.json({
          success: true,
          fileId,
          remainingCount: appReq.session.documents.documentDetails.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    RouteNames.documentSend,
    oidcMiddleware,
    async (req, res, next) => {
      try {
        const appReq = req as AppRequest;
        const isFDR = req.body.isFDR === 'on';

        if (!appReq.session.documents) {
          appReq.session.documents = {};
        }

        appReq.session.documents.isFinancialDisputeResolution = isFDR;

        await documentController.LinkDocumentsToCase(appReq);

        res.redirect(RouteNames.documents);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    RouteNames.documentDownload,
    oidcMiddleware,
    async (req, res, next) => {
      try {
        const { documentId } = req.params;

        const appReq = req as AppRequest;

        const normalizedDocumentId = Array.isArray(documentId)
          ? documentId[0]
          : documentId;

        const caseId = req.session.caseNumber;
        if (!caseId) {
          return res.status(400).send('Missing case ID in session');
        }

        await documentController.downloadDocument(
          appReq,
          res,
          normalizedDocumentId,
          caseId
        );
      } catch (error) {
        next(error);
      }
    }
  );
}
