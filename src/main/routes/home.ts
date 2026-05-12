import { Application } from 'express';
import multer from 'multer';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../app/auth/user';
import { getCaseApi } from '../app/case/case-api';
import { CaseAssignedUserRole } from '../app/case/case-roles';
import { CASE_TYPE } from '../app/case/case-type';
import { CaseRole } from '../app/case/definition';
import { AppRequest, UserDetails } from '../app/controller/AppRequest';
import { DocumentManagerController } from '../app/document/DocumentManagerController';
import { RouteNames } from '../common-constants';
import { orchestrateHome } from '../functions/util/homePageUtil';
import { oidcMiddleware } from '../middleware';

export default function (app: Application): void {
  const logger: LoggerInstance = console as unknown as LoggerInstance;
  app.get(RouteNames.basePath, oidcMiddleware, async (req, res) => {
    const user = req.session.user as UserDetails;
    const result = await orchestrateHome(user, logger);
    if (result.caseData) {
      req.session.caseData = result.caseData;
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
  });

  const documentController = new DocumentManagerController(logger);

  app.get('/documents', oidcMiddleware, (req, res) => {

    const uploadedDocuments = req.session.uploadedDocuments ?? [];

    delete req.session.uploadedDocuments;

    res.render('document', {
      uploadedDocuments,
    });

  });

  app.post(
    '/documents/upload',
    oidcMiddleware,
    upload.any(),
    async (req, res, next) => {
      try {
        await documentController.post(req as unknown as AppRequest, res);
        res.redirect('/documents');
      } catch (error) {
        next(error);
      }
    }
  );
}
