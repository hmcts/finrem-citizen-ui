import { LoggerInstance } from 'winston';

import { UserDetails } from '../controller/AppRequest';

import { CaseWithId } from './case';
import { CaseApiClient, getCaseApiClient } from './case-api-client';
import { CaseRole, FinremCaseData } from './definition';

export class CaseApi {
  constructor(private readonly apiClient: CaseApiClient) {}

  public async addUsersToCase(assignments: { case_id: string; user_id: string; case_role: CaseRole }[]): Promise<void> {
    await this.apiClient.addCaseUserRoles(assignments);
  }

  public async getCaseById(caseId: string): Promise<FinremCaseData> {
    return this.apiClient.getCaseById(caseId);
  }

  public async triggerEvent(caseId: string, userData: Partial<FinremCaseData>, eventName: string): Promise<CaseWithId> {
    return this.apiClient.sendEvent(caseId, userData, eventName);
  }
}

export const getCaseApi = (userDetails: UserDetails, logger: LoggerInstance): CaseApi => {
  return new CaseApi(getCaseApiClient(userDetails, logger));
};
