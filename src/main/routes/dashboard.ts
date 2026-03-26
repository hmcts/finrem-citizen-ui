import { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../common-constants';

export default function setupDashboardRoute(app: Application): void {
  app.get(RouteNames.dashboard, (req: Request, res: Response) => {
    res.render(ViewNames.Dashboard);
  });
}
