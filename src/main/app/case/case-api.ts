import { LoggerInstance } from 'winston';

import { UserDetails } from '../controller/AppRequest';

import { CaseApiClient, getCaseApiClient } from './case-api-client';
import { FinremCaseData } from './definition';

export class CaseApi {
  readonly maxRetries: number = 3;

  constructor(private readonly apiClient: CaseApiClient) {}

  public async getCaseById(caseId: string): Promise<FinremCaseData> {
    return this.apiClient.getCaseById(caseId);
  }
}

export const getCaseApi = (userDetails: UserDetails, logger: LoggerInstance): CaseApi => {
  return new CaseApi(getCaseApiClient(userDetails, logger));
};

