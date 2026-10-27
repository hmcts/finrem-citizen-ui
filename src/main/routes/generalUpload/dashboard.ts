import { Application, Request, Response } from 'express';

import { UserDetails } from '../../app/controller/AppRequest';
import { RouteNames, ViewNames } from '../../constants';
import { getDashboardLatestUpdateTemplate } from '../../functions/util/dashboard-template-selector';
import { oidcMiddleware } from '../../middleware';

export default function setupDashboardRoute(app: Application): void {
  app.get(
    RouteNames.dashboard,
    oidcMiddleware,
    async (req: Request, res: Response) => {
      const user = req.session.user as UserDetails | undefined;
      const isRepresented = user?.isRepresented ?? false;
      const caseState = req.session.caseData?.state;

      const latestCaseUpdateTemplate = getDashboardLatestUpdateTemplate(isRepresented, caseState);

      res.render(ViewNames.Dashboard, {
        userName: req.session.caseUserName,
        caseNumber: req.session.caseNumber,
        hasDivorceCase: user?.hasNFDCase ?? false,
        latestCaseUpdateTemplate,
        showPreviouslyUploaded: true,
      });
    }
  );
}
