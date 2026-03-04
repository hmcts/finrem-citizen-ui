import { LoggerInstance } from 'winston';

import { UserDetails } from '../controller/AppRequest';

import { CaseApiClient, getCaseApiClient } from './case-api-client';
import { CaseRole } from './definition';

export class CaseApi {
  readonly maxRetries: number = 3;

  constructor(private readonly apiClient: CaseApiClient) {}

  public async addUsersToCase(assignments: { case_id: string; user_id: string; case_role: CaseRole }[]): Promise<void> {
    await this.apiClient.addCaseUserRoles(assignments);
  }
}

export const getCaseApi = (userDetails: UserDetails, logger: LoggerInstance): CaseApi => {
  return new CaseApi(getCaseApiClient(userDetails, logger));
};
