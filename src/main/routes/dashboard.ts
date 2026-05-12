import { Application, Request, Response } from 'express';

import { UserDetails } from '../app/controller/AppRequest';
import { RouteNames, ViewNames } from '../common-constants';
import { oidcMiddleware } from '../middleware';
import { setCaseUserRole } from '../functions/util/homePageUtil';

export default function setupDashboardRoute(app: Application): void {
  app.get(RouteNames.dashboard, oidcMiddleware, async (req: Request, res: Response) => {
    const user = req.session.user as UserDetails | undefined;
    await setCaseUserRole(req.session);

    res.render(ViewNames.Dashboard, {
      userName: req.session.caseUserName,
      caseNumber: req.session.caseNumber,
      hasDivorceCase: user?.hasNFDCase ?? false,
      showPreviouslyUploaded: true,
    });
  });
}
