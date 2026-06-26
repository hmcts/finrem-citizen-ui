import { randomUUID } from 'crypto';
import { Application, Request, Response } from 'express';
import { promises as fs } from 'fs';
import multer from 'multer';
import { tmpdir } from 'os';
import path from 'path';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../app/auth/user';
import { getCaseApi } from '../app/case/case-api';
import { CaseAssignedUserRole } from '../app/case/case-roles';
import { CASE_TYPE } from '../app/case/case-type';
import { CaseRole, CitizenUploadDocumentType } from '../app/case/definition';
import { AppRequest, UserDetails } from '../app/controller/AppRequest';
import { DocumentManagerController } from '../app/document/DocumentManagerController';
import { RouteNames, ViewNames } from '../common-constants';
import { orchestrateHome } from '../functions/util/homePageUtil';
import { FILE_VALIDATION_ERRORS, validateUploadedFile } from '../functions/util/uploadValidation';
import { oidcMiddleware } from '../middleware';
import { trackApiClientExceptionTelemetry } from '../middleware/global-error-handler';

export default function (app: Application): void {
  const logger: LoggerInstance = console as unknown as LoggerInstance;
  app.get(RouteNames.basePath, oidcMiddleware, async (req, res) => {
    const user = req.session.user as UserDetails;
    const result = await orchestrateHome(user, logger);
    if (result.caseData) {
      req.session.caseData = result.caseData;
      req.session.caseNumber = result.caseNumber;
    }
    if (result.caseNumber) {
      req.session.caseNumber = result.caseNumber;
    }
    res.redirect(result.url);
  });

  app.get(RouteNames.caseReference, async (req, res) => {
    const { caseReference } = req.params;

    const systemUser = await getSystemUser();

    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const caseData = await caseworkerUserApi.getCaseById(caseReference);
    res.json(caseData);
  });

  app.get(RouteNames.caseUserRole, async (req, res) => {
    const assignments: CaseAssignedUserRole[] = [
      {
        case_id: req.params.caseReference,
        user_id: req.params.userId,
        case_role: req.params.caseRole as CaseRole,
      },
    ];
    try {
      const systemUser = await getSystemUser();
      const caseworkerUserApi = getCaseApi(systemUser, logger);

      await caseworkerUserApi.addUsersToCase(assignments);

      return res.status(200).json({
        success: true,
        message: 'User successfully added to case.',
        data: assignments,
      });
    } catch (error) {
      const err = error as Error;
      const errorMessage = 'Failed to add user to case.';
      logger.error('Error adding user to case', { error: err.message });
      trackApiClientExceptionTelemetry(err, errorMessage);
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: err.message,
      });
    }
  });

  app.get(RouteNames.retrieveCase, async (req, res) => {
    const caseApi = getCaseApi(req.session.user as UserDetails, logger);
    const caseId = await caseApi.getExistingUserCase(CASE_TYPE);
    res.json({ id: caseId });
  });

  const upload = multer({
    storage: multer.diskStorage({
      destination: tmpdir(),
      filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
    },
  });

  // Allow a small buffer above 100MB to account for multipart encoding overhead
  // (boundaries, field names, headers) so a file exactly at 100MB is not wrongly rejected.
  const MAX_UPLOAD_BYTES = 101 * 1024 * 1024;

  // Reject oversized uploads using the Content-Length header BEFORE Multer reads the body.
  function checkContentLength(req: Request, res: Response, next: (error?: Error) => void): void {
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > MAX_UPLOAD_BYTES) {
      const documentType = (req.query.documentType as string) || '';
      const returnUrl = (req.query.returnUrl as string) || RouteNames.documents;
      logger.warn('Upload rejected by Content-Length pre-check', { contentLength });
      return redirectWithError(req, res, next, documentType, returnUrl, FILE_VALIDATION_ERRORS.TOO_LARGE);
    }
    next();
  }

  async function cleanupUploadedFiles(files: Express.Multer.File[] | undefined): Promise<void> {
    await Promise.all((files ?? [])
      .filter(file => !!file.path)
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

  app.get(RouteNames.documents, oidcMiddleware, (req, res) => {
    const appReq = req as AppRequest;

    const documentCount =
      appReq.session.documents?.documentDetails?.length ?? 0;

    const isFDR =
      appReq.session.documents?.isFinancialDisputeResolution ?? false;

    const documentTypes = Object.entries(CitizenUploadDocumentType).map(
      ([key, value]) => ({
        value: key,
        label: value,
      })
    );

    const documents =
      (appReq.session.documents?.documentDetails ?? []).map(doc => {
        const url = doc.value?.DocumentLink?.document_url || '';

        const documentId = url.split('/').pop();

        return {
          ...doc,
          extractedDocumentId: documentId,
        };
      });

    res.render(ViewNames.Document, {
      documentTypes,
      documentCount,
      isFDR,
      documents,
    });
  });

  app.post(
    RouteNames.documentUpload,
    oidcMiddleware,
    checkContentLength,
    upload.any(),
    (err: Error, req: Request, res: Response, next: (error?: Error) => void) => {
      if (err) {
        const documentType = req.body.documentType as string;
        const returnUrl = req.body.returnUrl || RouteNames.documents;

        // Handle Multer-specific errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            logger.warn('File size limit exceeded', {
              fieldname: err.field,
              limit: '100MB'
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
        const returnUrl = req.body.returnUrl || RouteNames.documents;

        // Validate uploaded file
        const validationError = validateUploadedFile(req.files as Express.Multer.File[]);
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

        await cleanupUploadedFiles(req.files as Express.Multer.File[]);

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
        await cleanupUploadedFiles(req.files as Express.Multer.File[]);
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
    void cleanupUploadedFiles(req.files as Express.Multer.File[]);

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

  app.get(RouteNames.getCaseRole, oidcMiddleware, async (req, res) => {
    const user = req.session.user as UserDetails;
    res.json({ caseRole: user.caseRole });
  });

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
