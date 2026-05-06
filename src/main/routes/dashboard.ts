import { Application, Request, Response } from 'express';

import { CaseRole } from '../app/case/definition';
import { UserDetails } from '../app/controller/AppRequest';
import { RouteNames, ViewNames } from '../common-constants';
import { oidcMiddleware } from '../middleware';

export default function setupDashboardRoute(app: Application): void {
  app.get(RouteNames.dashboard, oidcMiddleware, (req: Request, res: Response) => {
    const user = req.session.user as UserDetails | undefined;
    const caseData = req.session.caseData;
    const caseRole = req.session.caseRole;

    // Determine user name based on role
    let userName = 'Unknown User';
    if (caseData && caseRole) {
      if (caseRole === CaseRole.APPLICANT) {
        userName = caseData.applicantFlags?.partyName || 'Applicant';
      } else if (caseRole === CaseRole.RESPONDENT) {
        userName = caseData.respondentFlags?.partyName || 'Respondent';
      }
    }

    res.render(ViewNames.Dashboard, {
      userName,
      caseNumber: req.session.caseNumber ?? '0000-0000-0000-0000',
      hasDivorceCase: user?.hasNFDCase ?? false,
      showPreviouslyUploaded: true,
    });
  });
}
