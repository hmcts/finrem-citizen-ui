import { CaseRole, FinremCaseData } from 'app/case/definition';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../app/auth/user';
import { getCaseApi } from '../../app/case/case-api';
import { UserDetails } from '../../app/controller/AppRequest';
import { RouteNames } from '../../common-constants';

export interface UserDefaultPageDetails {
  url: string;
  caseData?: FinremCaseData;
  caseRole?: CaseRole;
}

export async function getHomePageForUser(userDetails: UserDetails): Promise<UserDefaultPageDetails> {
  const logger: LoggerInstance = console as unknown as LoggerInstance;

  const caseApi = getCaseApi(userDetails, logger);
  const caseId = await caseApi.getExistingUserCase();
  logger.info('caseId returned is ', caseId);

  if (caseId?.trim()) {
    const systemUser = await getSystemUser();
    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const caseData = await caseworkerUserApi.getCaseById(caseId);
    const caseRole = await caseApi.getUsersRoleOnCase(caseId, userDetails.id);

    logger.info('Routing to : ', RouteNames.dashboard);
    return { caseData, url: RouteNames.dashboard, caseRole };
  } else {
    logger.info('Routing to : ', RouteNames.enterCaseNumber);
    return { url: RouteNames.enterCaseNumber };
  }
}
