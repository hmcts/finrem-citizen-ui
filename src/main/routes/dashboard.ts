import { Application, Request, Response } from 'express';

import { UserDetails } from '../app/controller/AppRequest';
import { RouteNames, ViewNames } from '../common-constants';
import { oidcMiddleware } from '../middleware';

export default function setupDashboardRoute(app: Application): void {
  app.get(RouteNames.dashboard, oidcMiddleware, (req: Request, res: Response) => {
    const user = req.session.user as UserDetails | undefined;

    res.render(ViewNames.Dashboard, {
      userName: 'Sam Thompson',
      caseNumber: req.session.caseNumber ?? '0000-0000-0000-0000',
      hasDivorceCase: user?.hasNFDCase ?? false,
      showPreviouslyUploaded: true,
    });
  });
}
