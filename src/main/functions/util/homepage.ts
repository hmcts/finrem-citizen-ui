import { SessionData } from 'express-session';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../app/auth/user';
import { getCaseApi } from '../../app/case/case-api';
import { RouteNames } from '../../route-names';

export async function getHomePageForUser(accessToken: string, session: SessionData): Promise<string> {
  const caseReference: string | null = '';
  const logger: LoggerInstance = console as unknown as LoggerInstance;
  if (caseReference?.trim()) {
    const systemUser = await getSystemUser();

    const caseworkerUserApi = getCaseApi(systemUser, logger);
    session.caseData = await caseworkerUserApi.getCaseById(caseReference);

    logger.info('Routing to : ', RouteNames.dashboard);
    return RouteNames.dashboard;
  } else {
    logger.info('Routing to : ', RouteNames.enterCaseNumber);
    return RouteNames.enterCaseNumber;
  }
}
