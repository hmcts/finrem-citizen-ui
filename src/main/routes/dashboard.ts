import { Application, Request, Response } from 'express';

import { RouteNames } from '../route-names';

export default function setupDashboardRoute(app: Application): void {
  app.get(RouteNames.dashboard, (req: Request, res: Response) => {
    res.render('dashboard');
  });
}
