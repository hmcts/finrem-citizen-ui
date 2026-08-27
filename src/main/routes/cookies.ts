import config from 'config';
import { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../common-constants';

export default function setupCookiesRoute(app: Application): void {
  app.get(RouteNames.cookies, (_req: Request, res: Response) => {
    res.render(ViewNames.Cookies, {
      sessionCookieName: config.get<string>('session.cookieName'),
    });
  });
}
