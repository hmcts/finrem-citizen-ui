import { Application, Request, Response } from 'express';

import { UserDetails } from '../app/controller/AppRequest';
import { RouteNames, ViewNames } from '../common-constants';
import { setCaseUserName, setCaseUserRole } from '../functions/util/homePageUtil';
import { oidcMiddleware } from '../middleware';
import { requireCaseRole } from '../middleware/require-case-role';

export default function setupDashboardRoute(app: Application): void {
  app.get( RouteNames.dashboard,oidcMiddleware,requireCaseRole, async (req: Request, res: Response) => {
      const user = req.session.user as UserDetails | undefined;
      await setCaseUserRole(req.session);
      setCaseUserName(req.session);

      res.render(ViewNames.Dashboard, {
        userName: req.session.caseUserName,
        caseNumber: req.session.caseNumber,
        hasDivorceCase: user?.hasNFDCase ?? false,
        showPreviouslyUploaded: true,
      });
    });
}
