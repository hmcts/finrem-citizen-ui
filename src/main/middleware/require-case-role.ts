import { NextFunction, Request, Response } from 'express';

import { UserDetails } from '../app/controller/AppRequest';
import { hasValidCaseRole } from '../functions/util/roleGuardUtil';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function requireCaseRole(req: Request, res: Response, next: NextFunction) {
  const user = req.session.user as UserDetails | undefined;

  if (!hasValidCaseRole(user?.caseRole)) {
    return res.status(403).render('error.njk', {
      message: 'You are not allowed to access this page.',
    });
  }

  next();
}

