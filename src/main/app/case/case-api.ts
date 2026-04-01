import { LoggerInstance } from 'winston';

import { UserDetails } from '../controller/AppRequest';
import { CaseApiClient, getCaseApiClient } from './case-api-client';
import { CASE_TYPE } from './case-type';
import { CaseRole, FinremCaseData } from './definition';

export class CaseApi {
  constructor(
    private readonly apiClient: CaseApiClient,
    private readonly logger: LoggerInstance) { }

  public async addUsersToCase(assignments: { case_id: string; user_id: string; case_role: CaseRole }[]): Promise<void> {
    await this.apiClient.addCaseUserRoles(assignments);
  }

  public async getCaseById(caseId: string): Promise<FinremCaseData> {
    return this.apiClient.getCaseById(caseId);
  }

  public async getExistingUserCase(): Promise<string | undefined> {
    const userCases = await this.apiClient.findExistingUserCases(CASE_TYPE);

    if (!userCases || userCases.length === 0) {
      return undefined;
    }

    if (userCases.length > 1) {
      const message = `More than one case found for caseType "${CASE_TYPE}". Expected exactly one. Found: ${userCases.length}.`;
      this.logger.error(message);
      throw new Error(message);
    }
    this.logger.info('userCases[0]', userCases[0]);
    return String(userCases[0].id);
  }
}

export const getCaseApi = (userDetails: UserDetails, logger: LoggerInstance): CaseApi => {
  return new CaseApi(getCaseApiClient(userDetails, logger), logger);
};
