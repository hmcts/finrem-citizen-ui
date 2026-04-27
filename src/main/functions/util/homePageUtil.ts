import { CaseType, FinremCaseData } from 'app/case/definition';
import { Request } from 'express';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../app/auth/user';
import { getCaseApi } from '../../app/case/case-api';
import { CASE_TYPE } from '../../app/case/case-type';
import { UserDetails } from '../../app/controller/AppRequest';
import { RouteNames } from '../../common-constants';

export interface UserDefaultPageDetails {
  url: string;
  caseData?: FinremCaseData
}

export interface HomeOrchestratorResult {
  url: string;
  caseData?: FinremCaseData;
  hasNFDCase?: boolean;
}

export async function getHomePageForUser(userDetails: UserDetails): Promise<UserDefaultPageDetails> {
  const logger: LoggerInstance = console as unknown as LoggerInstance;

  const caseApi = getCaseApi(userDetails, logger);
  const caseId = await caseApi.getExistingUserCase(CASE_TYPE);
  logger.info('caseId returned is ', caseId);

  if (caseId?.trim()) {
    const systemUser = await getSystemUser();
    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const caseData = await caseworkerUserApi.getCaseById(caseId);

    logger.info('Routing to : ', RouteNames.dashboard);
    return { caseData, url: RouteNames.dashboard };
  } else {
    logger.info('Routing to : ', RouteNames.enterCaseNumber);
    return { url: RouteNames.enterCaseNumber };
  }
}

export async function orchestrateHome(
  user: UserDetails,
  logger: LoggerInstance,
  nfdCaseAlreadyChecked: boolean
): Promise<HomeOrchestratorResult> {
  let hasNFDCase: boolean | undefined;

  if (!nfdCaseAlreadyChecked) {
    const caseApi = getCaseApi(user, logger);
    const nfdCase = await caseApi.getExistingUserCase(CaseType.NFD);
    hasNFDCase = nfdCase !== undefined;
    logger.info('hasNFDCase:', hasNFDCase);
  }

  const { url, caseData } = await getHomePageForUser(user);

  return { url, caseData, hasNFDCase };
}

/**
 * Loads a case by reference from CCD and stores it in the session
 * @param req - Express request object with session
 * @param caseReference - Case reference/ID (with or without hyphens)
 * @param logger - Logger instance
 * @returns Promise<FinremCaseData> - The loaded case data
 * @throws Error if case is not found or cannot be loaded
 */
export async function loadCaseAndReloadSession(
  req: Request,
  caseReference: string,
  logger: LoggerInstance
): Promise<FinremCaseData> {
  const ccdUrl = require('config').get('services.case.url');
  const caseId = caseReference.replace(/-/g, '');

  logger.info(`Loading case ${caseId} from CCD backend: ${ccdUrl}`);

  try {
    const systemUser = await getSystemUser();
    const caseApi = getCaseApi(systemUser, logger);
    const caseData = await caseApi.getCaseById(caseId);

    logger.info(`Case ${caseId} successfully loaded from CCD`);

    req.session.caseData = caseData;

    return caseData;
  } catch (error) {
    logger.error(`Failed to load case ${caseId} from CCD:`, error);
    throw error;
  }
}
