import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import config from 'config';
import { LoggerInstance } from 'winston';

import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { UserDetails } from '../controller/AppRequest';

import { CaseWithId } from './case';
import { CaseAssignedUserRole } from './case-roles';
import { FinremCaseData, FinremCaseDetails, State } from './definition';

export class CaseApiClient {
  readonly maxRetries: number = 3;

  constructor(
    private readonly server: AxiosInstance,
    private readonly logger: LoggerInstance
  ) {}

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
      const response = await this.server.get<FinremCaseDetails>(`/cases/${caseId}`);
      return response.data.data;
    } catch (err) {
      this.logError(err as AxiosError);
      throw new Error('Case could not be retrieved.');
    }
  }

  public async sendEvent(
    caseId: string,
    data: Partial<FinremCaseData>,
    eventName: string,
    retries = 0
  ): Promise<CaseWithId> {
    try {
      const tokenResponse = await this.server.get<CcdTokenResponse>(`/cases/${caseId}/event-triggers/${eventName}`);
      const token = tokenResponse.data.token;
      const event = { id: eventName };
      const response: AxiosResponse<CcdV2Response> = await this.server.post(`/cases/${caseId}/events`, {
        event,
        data,
        event_token: token,
      });

      // return { id: response.data.id, state: response.data.state, ...fromApiFormat(response.data.data) };
      // return response.data.data;

      const { state: _ignored, ...caseData } = response.data.data;

      return {
        id: response.data.id,
        state: response.data.state,
        ...caseData,
      } as CaseWithId;
    } catch (err) {
      if (retries < this.maxRetries && [409, 422, 502, 504].includes(err?.response.status)) {
        ++retries;
        this.logger.info(`retrying send event due to ${err.response.status}. this is retry no (${retries})`);
        return this.sendEvent(caseId, data, eventName, retries);
      }
      this.logError(err);
      throw new Error('Case could not be updated.');
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
  if (!userDetails?.accessToken) {
    logger.error('Missing access token in userDetails');
    throw new Error('Access token is required to create Case API client');
  }
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

interface CcdV2Response {
  id: string;
  state: State;
  data: FinremCaseData;
}

interface CcdTokenResponse {
  token: string;
}
