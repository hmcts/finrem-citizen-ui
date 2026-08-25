import { Request } from 'express';
import { SessionData } from 'express-session';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../app/auth/user';
import { getCaseApi } from '../../app/case/case-api';
import { CASE_TYPE } from '../../app/case/case-type';
import { CaseRole, CaseType, FinremCaseData } from '../../app/case/definition';
import { UserDetails } from '../../app/controller/AppRequest';
import { CaseUserNames, RouteNames } from '../../common-constants';

export interface HomeOrchestratorResult {
  url: string;
  caseData?: FinremCaseData;
  caseNumber?: string;
}

export interface UserCaseContext {
  caseData?: FinremCaseData;
  caseNumber?: string;
}

export function resolveHomeUrl(caseContext: UserCaseContext): string {
  return caseContext.caseNumber?.trim() ? RouteNames.dashboard : RouteNames.enterCaseNumber;
}

export async function loadUserCaseContext(
  user: UserDetails,
  logger: LoggerInstance,
): Promise<UserCaseContext> {
  if (user.hasNFDCase === undefined) {
    const caseApi = getCaseApi(user, logger);
    const nfdCase = await caseApi.getExistingUserCase(CaseType.NFD);
    user.hasNFDCase = nfdCase !== undefined;
  }
  logger.info('User has NFD case registered: ', user.hasNFDCase);

  const caseApi = getCaseApi(user, logger);
  const caseId = await caseApi.getExistingUserCase(CASE_TYPE);
  logger.info('Financial Remedy caseId is: ', caseId);

  if (caseId?.trim()) {
    const systemUser = await getSystemUser();
    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const caseData = await caseworkerUserApi.getCaseById(caseId);
    return { caseData, caseNumber: caseId };
  }

  return {};
}

export async function orchestrateHome(
  user: UserDetails,
  logger: LoggerInstance,
): Promise<HomeOrchestratorResult> {
  const caseContext = await loadUserCaseContext(user, logger);
  const url = resolveHomeUrl(caseContext);
  logger.info('Routing to : ', url);

  return { ...caseContext, url };
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

export async function setCaseUserRole(session: SessionData): Promise<void> {
  const logger: LoggerInstance = console as unknown as LoggerInstance;
  const user = session.user as UserDetails;
  if (session.caseNumber && !user.caseRole) {
    const caseApi = getCaseApi(user, logger);
    const caseRole = await caseApi.getUsersRoleOnCase(session.caseNumber, user.id);
    user.caseRole = caseRole;
  }
  logger.info('case role is ', user.caseRole);
}

export function setCaseUserName(session: SessionData): void {
  const logger: LoggerInstance = console as unknown as LoggerInstance;
  const user = session.user as UserDetails;

  if (user.caseRole && session.caseData && !session.caseUserName) {
    if (user.caseRole === CaseRole.APPLICANT) {
      session.caseUserName = session.caseData.applicantFlags?.partyName || CaseUserNames.APPLICANT;
    } else if (user.caseRole === CaseRole.RESPONDENT) {
      session.caseUserName = session.caseData.respondentFlags?.partyName || CaseUserNames.RESPONDENT;
    }
    logger.info('case user name set to ', session.caseUserName);
  }
}
