import { LoggerInstance } from 'winston';

import { getSystemUser } from '../auth/user';
import { UserDetails } from '../controller/AppRequest';
import { CaseApiClient, getCaseApiClient } from './case-api-client';
import { EVENT_TYPE } from './case-type';
import { CaseRole, CaseType, FinremCaseData } from './definition';

export class CaseApi {
  constructor(
    private readonly apiClient: CaseApiClient,
    private readonly logger: LoggerInstance
  ) {}

  public async addUsersToCase(assignments: { case_id: string; user_id: string; case_role: CaseRole }[]): Promise<void> {
    await this.apiClient.addCaseUserRoles(assignments);
  }

  public async getCaseById(caseId: string): Promise<FinremCaseData> {
    return this.apiClient.getCaseById(caseId);
  }

  public async getExistingNfdCase(): Promise<string | undefined> {
    const userCases = await this.apiClient.findUserCaseRefs(
      CaseType.NFD,
      JSON.stringify({
        query: { match_all: {} },
        size: 2, // only need 0/1/many
      })
    );

    if (!userCases || userCases.length === 0) {
      return undefined;
    }

    if (userCases.length > 1) {
      const message = `More than one NFD case found. Expected exactly one. Found: ${userCases.length}.`;
      this.logger.error(message);
      throw new Error(message);
    }

    return String(userCases[0].id);
  }

  public async getExistingFRUserCase(): Promise<string | undefined> {
    const userCases = await this.apiClient.findUserCases(
      CaseType.CONTESTED,
      JSON.stringify({
        query: { match_all: {} },
        size: 2, // only need 0/1/many,
      })
    );

    if (!userCases || userCases.length === 0) {
      return undefined;
    }

    if (userCases.length > 1) {
      const message = `More than one case found for caseType FR. Expected exactly one. Found: ${userCases.length}.`;
      this.logger.error(message);
      throw new Error(message);
    }
    return String(userCases[0].id);
  }

  public async getUsersRoleOnCase(caseId: string, userId: string): Promise<CaseRole | undefined> {
    const response = await this.apiClient.getCaseUserRoles({ case_ids: [caseId], user_ids: [userId] });
    return response.case_users[0]?.case_role;
  }

  public async triggerEvent(
    caseId: string,
    partialCaseData: Partial<FinremCaseData>,
    eventName: string
  ): Promise<FinremCaseData> {
    return this.apiClient.sendEvent(caseId, partialCaseData, eventName);
  }
}

export const getCaseApi = (userDetails: UserDetails, logger: LoggerInstance): CaseApi => {
  return new CaseApi(getCaseApiClient(userDetails, logger), logger);
};

export const triggerSystemEvent = async (
  caseId: string,
  data: Partial<FinremCaseData>,
  eventName: EVENT_TYPE,
  logger: LoggerInstance
): Promise<FinremCaseData> => {
  logger.info('Triggering system event', { caseId, eventName });

  try {
    const systemUser = await getSystemUser();
    const caseworkerUserApi = getCaseApi(systemUser, logger);
    const updatedCaseData = await caseworkerUserApi.triggerEvent(caseId, data, eventName);

    logger.info('System event triggered successfully', { caseId, eventName });

    return updatedCaseData;
  } catch (error) {
    logger.error('Failed to trigger system event', { caseId, eventName, error });
    throw error;
  }
};
