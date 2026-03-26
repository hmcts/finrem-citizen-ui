import { FinremCaseData } from 'app/case/definition';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../app/auth/user';
import { getCaseApi } from '../../app/case/case-api';
import { UserDetails } from '../../app/controller/AppRequest';
import { ViewNames } from '../../common-constants';

export interface UserDefaultPageDetails {
  url: string;
  caseData?: FinremCaseData
}

export async function getHomePageForUser(userDetails: UserDetails): Promise<UserDefaultPageDetails> {
  const logger: LoggerInstance = console as unknown as LoggerInstance;

  const caseApi = getCaseApi(userDetails, logger);
  const caseId = await caseApi.getExistingUserCase();

  if (caseId?.trim()) {
    const systemUser = await getSystemUser();
    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const caseData = await caseworkerUserApi.getCaseById(caseId);

    logger.info('Routing to : ', ViewNames.Dashboard);
    return { caseData, url: ViewNames.Dashboard };
  } else {
    logger.info('Routing to : ', ViewNames.EnterCaseNumber);
    return { url: ViewNames.EnterCaseNumber };
  }
}
