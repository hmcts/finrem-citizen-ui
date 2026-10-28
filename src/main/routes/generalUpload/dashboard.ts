import { Logger } from '@hmcts/nodejs-logging';
import { Application, Request, Response } from 'express';

import { UserDetails } from '../../app/controller/AppRequest';
import { RouteNames, ViewNames } from '../../constants';
import { getDashboardLatestCaseUpdateTemplate } from '../../functions/util/dashboard-template-selector';
import { oidcMiddleware } from '../../middleware';

const logger = Logger.getLogger('dashboard');

export default function setupDashboardRoute(app: Application): void {
  app.get(
    RouteNames.dashboard,
    oidcMiddleware,
    async (req: Request, res: Response) => {
      const user = req.session.user as UserDetails | undefined;
      const isRepresented = user?.isRepresented ?? false;
      const caseState = req.session.caseData?.state;

      const latestCaseUpdateTemplate = getDashboardLatestCaseUpdateTemplate(isRepresented, caseState);

      logger.info('Dashboard template selected',
        {
          latestCaseUpdateTemplate,
          caseId: req.session.caseNumber,
          caseState,
          isRepresented
        }
      );

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
