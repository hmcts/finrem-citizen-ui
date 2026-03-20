import { Application, Request, Response } from 'express';

import { RouteNames } from '../route-names';

export default function setupEnterAccessCodeRoute(app: Application): void {
  app.get(RouteNames.enterAccessCode, (req: Request, res: Response) => {
    res.render('enter-access-code');
  });
}
