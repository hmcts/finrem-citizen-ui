import { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../constants';
import { renderLocalizedView } from '../modules/i18n';
import { generateContactUsContent as pageContent } from '../views/contact-us/content';

export default function setupContactUsRoute(app: Application): void {
  app.get(RouteNames.contactUs, (req: Request, res: Response) => {
    renderLocalizedView(
      req, res, ViewNames.ContactUs, pageContent
    );
  });
}
