import { LoggerInstance } from 'winston';

import { UserDetails } from '../controller/AppRequest';

import { CaseApiClient, CcdV1Response, getCaseApiClient } from './case-api-client';
import { CaseAssignedUserRoles } from './case-roles';
import { CASE_TYPE } from './case-type';
import { UserRole } from './definition';

export class CaseApi {
  readonly maxRetries: number = 3;

  constructor(private readonly apiClient: CaseApiClient) { }

  public async getExistingAndNewUserCases(
    serviceType: string
  ): Promise<{ existingUserCase: CcdV1Response | false }> {
    const existingUserCase = await this.getExistingUserCase(serviceType);
    return { existingUserCase };
  }

  public async getExistingUserCase(serviceType: string): Promise<CcdV1Response | false> {
    const userCases = await this.apiClient.findExistingUserCases(CASE_TYPE, serviceType);

    // Return raw CCD case format — no transformations, no mapping, no sorting.
    if (userCases && userCases.length > 0) {
      return userCases[0];
    }

    return false;
  }

  public async getUserCaseRole(
    caseId: string,
    userId: string
  ): Promise<'APPLICANT' | 'RESPONDENT' | 'UNKNOWN'> {
    const userRole: UserRole = await this.getUsersRoleOnCase(caseId, userId);

    if (userRole === UserRole.APPLICANT) {
      return 'APPLICANT';
    }

    if (userRole === UserRole.RESPONDENT) {
      return 'RESPONDENT';
    }

    return 'UNKNOWN';
  }


  public async getUsersRoleOnCase(caseId: string, userId: string): Promise<UserRole> {
    const userRoles: CaseAssignedUserRoles = await this.apiClient.getCaseUserRoles(caseId, userId);
    return userRoles.case_users[0]?.case_role;
  }
}

export const getCaseApi = (userDetails: UserDetails, logger: LoggerInstance): CaseApi => {
  return new CaseApi(getCaseApiClient(userDetails, logger));
};
