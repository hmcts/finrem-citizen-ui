import { Application, Request, Response } from 'express';
import multer from 'multer';
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
      logger.error('Error adding user to case', { error: err.message });

      return res.status(500).json({
        success: false,
        message: 'Failed to add user to case.',
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
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
    },
  });

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
          return redirectWithError(req, res, documentType, returnUrl, validationError);
        }

        // Convert kebab-case to SCREAMING_SNAKE_CASE for enum lookup
        const documentTypeKey = documentType
          .toUpperCase()
          .replace(/-/g, '_');
        
        const selectedType =
          CitizenUploadDocumentType[
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
          return redirectWithError(req, res, documentType, returnUrl, FILE_VALIDATION_ERRORS.UPLOAD_FAILED);
        }

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
        next(error);
      }
    }
  );

  function redirectWithError(
    req: Request,
    res: Response,
    documentType: string,
    returnUrl: string,
    errorMessage: string
  ): void {
    // Store error in session
    if (!req.session.uploadErrors) {
      req.session.uploadErrors = {};
    }
    req.session.uploadErrors[documentType] = errorMessage;
    
    req.session.save((err) => {
      if (err) {
        throw err;
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

        if (!appReq.session.documents) {
          appReq.session.documents = {};
        }

        appReq.session.documents.isFinancialDisputeResolution =
          req.body.isFinancialDisputeResolution === 'on';

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
