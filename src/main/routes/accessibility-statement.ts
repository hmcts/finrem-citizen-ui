import { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../constants';
import { renderLocalizedView } from '../modules/i18n';
import { generateAccessibilityStatementContent as pageContent } from '../views/accessibility-statement/content';

export default function setupAccessibilityStatementRoute(app: Application): void {
  app.get(RouteNames.accessibilityStatement, (req: Request, res: Response) => {
    renderLocalizedView(
      req, res, ViewNames.AccessibilityStatement, pageContent
    );
  });
}
