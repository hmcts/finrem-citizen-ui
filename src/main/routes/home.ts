import { Application, Request, Response } from 'express';

import { getConfigValue } from '../configuration';
import { IDAM_CLIENT, OAUTH_CALLBACK_URL, SERVICES_IDAM_WEB } from '../configuration/references';

export default function (app: Application): void {
  app.get('/', (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAuthenticated = req.session && (req.session as any).auth;

    if (!isAuthenticated) {
      const idamUrl = getConfigValue(SERVICES_IDAM_WEB);
      const clientId = getConfigValue(IDAM_CLIENT);
      const redirectUri = getConfigValue(OAUTH_CALLBACK_URL);
      const loginUrl = `${idamUrl}/login?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=profile openid roles`;
      return res.redirect(loginUrl);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.render('home', { user: (req.session as any).auth });
  });
}
