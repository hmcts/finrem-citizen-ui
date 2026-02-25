import axios, { AxiosError, AxiosInstance } from 'axios';
import config from 'config';
import { LoggerInstance } from 'winston';

import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { UserDetails } from '../controller/AppRequest';

import { CaseAssignedUserRoles } from './case-roles';

import { CaseData, State } from './definition';

export class CaseApiClient {
  readonly maxRetries: number = 3;

  constructor(
    private readonly server: AxiosInstance,
    private readonly logger: LoggerInstance
  ) {}

  public async findExistingUserCases(caseType: string, serviceType: string): Promise<CcdV1Response[] | false> {
    const query = {
      query: { match_all: {} },
      sort: [{ created_date: { order: 'desc' } }],
    };
    return this.findUserCases(caseType, serviceType, JSON.stringify(query));
  }

  private async findUserCases(caseType: string, serviceType: string, query: string): Promise<CcdV1Response[] | false> {
    try {
      const response = await this.server.post<ES<CcdV1Response>>(`/searchCases?ctid=${caseType}`, query);
      return caseType === 'DIVORCE'
        ? response.data.cases
        : response.data.cases.filter(c => c.case_data.divorceOrDissolution === serviceType);
    } catch (err) {
      if (err.response?.status === 404) {
        return false;
      }
      this.logError(err);
      throw new Error('Case could not be retrieved.');
    }
  }

  public async getCaseUserRoles(caseId: string, userId: string): Promise<CaseAssignedUserRoles> {
    try {
      const response = await this.server.get<CaseAssignedUserRoles>(`case-users?case_ids=${caseId}&user_ids=${userId}`);
      return response.data;
    } catch (err) {
      this.logError(err);
      throw new Error('Case roles could not be fetched.');
    }
  }

  private logError(error: AxiosError) {
    if (error.response) {
      this.logger.error(`API Error ${error.config?.method} ${error.config?.url} ${error.response.status}`);
      this.logger.info('Response: ', error.response.data);
    } else if (error.request) {
      this.logger.error(`API Error ${error.config?.method} ${error.config?.url}`);
    } else {
      this.logger.error('API Error', error.message);
    }
  }
}

export const getCaseApiClient = (userDetails: UserDetails, logger: LoggerInstance): CaseApiClient => {
  return new CaseApiClient(
    axios.create({
      baseURL: config.get('services.case.url'),
      headers: {
        Authorization: 'Bearer ' + userDetails.accessToken,
        ServiceAuthorization: getServiceAuthToken(),
        experimental: 'true',
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
    }),
    logger
  );
};

interface ES<T> {
  cases: T[];
  total: number;
}

export interface CcdV1Response {
  id: string;
  state: State;
  created_date: string;
  case_data: CaseData;
}