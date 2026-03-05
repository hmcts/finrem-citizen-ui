import axios, { AxiosError, AxiosInstance } from 'axios';
import config from 'config';
import { LoggerInstance } from 'winston';

import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { UserDetails } from '../controller/AppRequest';

import { CaseAssignedUserRole } from './case-roles';
import {FinremCaseData, State} from './definition';

export class CaseApiClient {
  readonly maxRetries: number = 3;

  constructor(private readonly server: AxiosInstance, private readonly logger: LoggerInstance) {}

  public async addCaseUserRoles(assignments: CaseAssignedUserRole[]): Promise<void> {
    try {
      const payload = {
        case_users: assignments,
      };

      await this.server.post('/case-users', payload);
    } catch (err) {
      this.logError(err as AxiosError);
      throw new Error('Case user roles could not be added.');
    }
  }

  public async getCaseById(caseId: string): Promise<FinremCaseData> {
    try {
      console.log("calling ccd::")
      const response = await this.server.get<CcdV1Response>(`/cases/${caseId}`);
      console.log("response from ccd::", response)
      return response.data.case_data ;
    } catch (err) {
      console.log("error:::::::", err?.data)
      this.logError(err);
      throw new Error('Case could not be retrieved.');
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
  const serviceAuthToken = getServiceAuthToken();
  return new CaseApiClient(
    axios.create({
      baseURL: config.get('services.case.url'),
      headers: {
        Authorization: 'Bearer ' + userDetails.accessToken,
        ServiceAuthorization: serviceAuthToken,
        experimental: 'true',
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
    }),
    logger
  );
};

export interface CcdV1Response {
  id: string;
  state: State;
  created_date: string;
  case_data: FinremCaseData;
}

