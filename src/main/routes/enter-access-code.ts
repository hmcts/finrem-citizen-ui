import { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../common-constants';

export default function setupEnterAccessCodeRoute(app: Application): void {
  app.get(RouteNames.enterAccessCode, (req: Request, res: Response) => {
    res.render(ViewNames.EnterAccessCode);
  });
}
