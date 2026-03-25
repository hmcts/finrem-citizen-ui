import { SessionData } from 'express-session';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../app/auth/user';
import { getCaseApi } from '../../app/case/case-api';
import { UserDetails } from '../../app/controller/AppRequest';
import { ViewNames } from '../../common-constants';

export async function getHomePageForUser(session: SessionData): Promise<string> {
  const logger: LoggerInstance = console as unknown as LoggerInstance;

  const caseApi = getCaseApi(session.user as UserDetails, logger);
  const caseId = await caseApi.getExistingUserCase();

  if (caseId?.trim()) {
    const systemUser = await getSystemUser();
    const caseworkerUserApi = getCaseApi(systemUser, logger);
    session.caseData = await caseworkerUserApi.getCaseById(caseId);

    logger.info('Routing to : ', ViewNames.Dashboard);
    return ViewNames.Dashboard;
  } else {
    logger.info('Routing to : ', ViewNames.EnterCaseNumber);
    return ViewNames.EnterCaseNumber;
  }
}
