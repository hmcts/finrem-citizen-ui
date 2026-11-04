import type { RequestHandler } from 'express';

import { restoreUploadDraft } from '../modules/upload-draft';

export const uploadDraftMiddleware: RequestHandler = async (
  req,
  _res,
  next
): Promise<void> => {
  const userId = req.session.user?.id;
  const caseNumber = req.session.caseNumber;
  const caseRole = req.session.user?.caseRole;

  if (!userId || !caseNumber || !caseRole) {
    return next();
  }

  const context = JSON.stringify([userId, caseNumber, caseRole]);

  if (req.session.uploadDraftRestoredFor === context) {
    return next();
  }

  try {
    await restoreUploadDraft(req);
    req.session.uploadDraftRestoredFor = context;
    next();
  } catch (error) {
    next(error);
  }
};
