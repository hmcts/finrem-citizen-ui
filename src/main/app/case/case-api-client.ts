import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import config from 'config';
import { LoggerInstance } from 'winston';

import { TestRoutes, UrlEndPoints } from '../../common-constants';
import { getServiceAuthToken } from '../auth/service/get-service-auth-token';
import { UserDetails } from '../controller/AppRequest';
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

      await this.server.post(UrlEndPoints.CaseUsers, payload);
    } catch (err) {
      this.logError(err as AxiosError);
      throw new Error('Case user roles could not be added.');
    }
  }

  public async getCaseById(caseId: string): Promise<FinremCaseData> {
    try {
      const response = await this.server.get<FinremCaseDetails>(UrlEndPoints.CaseId(caseId));
      return response.data.data;
    } catch (err) {
      this.logError(err as AxiosError);
      throw new Error('Case could not be retrieved.');
    }
  }

  public async findExistingUserCases(caseType: string): Promise<CcdV1Response[] | false> {
    const query = {
      query: { match_all: {} },
      sort: [{ created_date: { order: 'desc' } }],
    };
    return this.findUserCases(caseType, JSON.stringify(query));
  }

  private async findUserCases(caseType: string, query: string): Promise<CcdV1Response[] | false> {
    try {
      const response = await this.server.post<ES<CcdV1Response>>(UrlEndPoints.SearchCases(caseType), query);
      return response.data.cases;
    } catch (err) {
      if (err.response?.status === 404) {
        return false;
      }
      this.logError(err);
      throw new Error('Case could not be retrieved.');
    }
  }

  public async sendEvent(
    caseId: string,
    data: Partial<FinremCaseData>,
    eventName: string,
    retries = 0
  ): Promise<FinremCaseData> {
    try {
      const tokenResponse = await this.server.get<CcdTokenResponse>(UrlEndPoints.CaseEventTrigger(caseId, eventName));
      const token = tokenResponse.data.token;
      const event = { id: eventName };
      const response: AxiosResponse<CcdV2Response> = await this.server.post(UrlEndPoints.CaseEvents(caseId), {
        event,
        data,
        event_token: token,
      });

      const { state: _ignored, ...caseData } = response.data.data;

      return {
        id: response.data.id,
        state: response.data.state,
        ...caseData,
      } as FinremCaseData;
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

  const isTestSupportMode = process.env.ENABLE_TEST_SUPPORT_ROUTES === 'true';
  const localPort = process.env.PORT || '3000';
  const baseUrl = isTestSupportMode
    ? `http://127.0.0.1:${localPort}${TestRoutes.mockCcdBase}`
    : config.get<string>('services.case.url');

  const serviceAuthToken = getServiceAuthToken();
  return new CaseApiClient(
    axios.create({
      baseURL: baseUrl,
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

interface ES<T> {
  cases: T[];
  total: number;
}

export interface CcdV1Response {
  id: string;
  state: State;
  created_date: string;
  case_data: FinremCaseData;
}


interface CcdV2Response {
  id: string;
  state: State;
  data: FinremCaseData;
}

interface CcdTokenResponse {
  token: string;
}
