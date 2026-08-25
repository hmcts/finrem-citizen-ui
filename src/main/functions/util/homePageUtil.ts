import { Request } from 'express';
import { SessionData } from 'express-session';
import { LoggerInstance } from 'winston';

import { getSystemUser } from '../../app/auth/user';
import { getCaseApi } from '../../app/case/case-api';
import { CASE_TYPE } from '../../app/case/case-type';
import { CaseRole, CaseType, FinremCaseData } from '../../app/case/definition';
import { UserDetails } from '../../app/controller/AppRequest';
import { CaseUserNames, RouteNames } from '../../common-constants';

export interface UserCaseContext {
  caseData?: FinremCaseData;
  caseNumber?: string;
}

export function resolveHomeUrl(caseContext: UserCaseContext): string {
  return caseContext.caseNumber?.trim() ? RouteNames.dashboard : RouteNames.enterCaseNumber;
}

export async function fetchUserCaseContext(
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

export async function hydrateUserSessionWithCaseContext(
  session: SessionData,
  logger: LoggerInstance
): Promise<UserCaseContext> {
  const user = session.user as UserDetails;
  const caseContext = await fetchUserCaseContext(user, logger);

  if (caseContext.caseNumber) {
    session.caseNumber = caseContext.caseNumber;
    session.caseData = caseContext.caseData;
    user.caseRole = await fetchUserCaseRole(session, logger);
    session.caseUserName = resolveCaseUserName(session);
  } else {
    delete session.caseNumber;
    delete session.caseData;
    delete user.caseRole;
    delete session.caseUserName;
  }

  return caseContext;
}

export function resetCaseContext(session: SessionData): void {
  delete session.caseContextHydratedUserId;
  delete session.caseNumber;
  delete session.caseData;
  delete session.caseUserName;

  const user = session.user as UserDetails | undefined;
  if (user) {
    delete user.caseRole;
    delete user.hasNFDCase;
  }
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

export async function fetchUserCaseRole(
  session: SessionData,
  logger: LoggerInstance = console as unknown as LoggerInstance
): Promise<CaseRole | undefined> {
  const user = session.user as UserDetails;

  if (user.caseRole) {
    return user.caseRole;
  }

  if (session.caseNumber) {
    const caseApi = getCaseApi(user, logger);
    return caseApi.getUsersRoleOnCase(session.caseNumber, user.id);
  }

  return undefined;
}

export function setCaseUserName(session: SessionData): void {
  const logger: LoggerInstance = console as unknown as LoggerInstance;
  const caseUserName = resolveCaseUserName(session);

  if (caseUserName && !session.caseUserName) {
    session.caseUserName = caseUserName;
    logger.info('case user name set to ', session.caseUserName);
  }
}

export function resolveCaseUserName(session: SessionData): string | undefined {
  const user = session.user as UserDetails;

  if (session.caseUserName) {
    return session.caseUserName;
  }

  if (user.caseRole && session.caseData) {
    if (user.caseRole === CaseRole.APPLICANT) {
      return session.caseData.applicantFlags?.partyName || CaseUserNames.APPLICANT;
    }

    if (user.caseRole === CaseRole.RESPONDENT) {
      return session.caseData.respondentFlags?.partyName || CaseUserNames.RESPONDENT;
    }
  }

  return undefined;
}
