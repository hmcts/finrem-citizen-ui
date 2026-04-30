import { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../common-constants';
import { oidcMiddleware } from '../middleware';

export default function setupDashboardRoute(app: Application): void {
  app.get(RouteNames.dashboard, oidcMiddleware, (req: Request, res: Response) => {
    res.render(ViewNames.Dashboard, {
      userName: 'Sam Thompson',
      caseNumber: '1674-2354-3687-4537',
      hasDivorceCase: true,
      showPreviouslyUploaded: true,
    });
  });
}
