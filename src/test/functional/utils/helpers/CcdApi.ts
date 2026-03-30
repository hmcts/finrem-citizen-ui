import { AxiosResponse } from 'axios';
import { readFileSync } from 'fs';
import { set, unset } from 'lodash';
import path from 'path';

import config from '../../config/config';
import { JsonValue, ReplacementAction } from '../../types/replacement-action';
import { updateJsonFileWithEnvValues } from '../test_data/JsonEnvValReplacer';
import { axiosRequest } from './ApiHelper';
import { getServiceToken, getUserId, getUserToken } from './TokenHelperApi';

// CCD payload and response types
interface CcdEventPayload {
  data: Record<string, JsonValue>;
  event: {
    id: string;
    summary: string;
    description: string;
  };
  event_token: string;
}

interface CcdCaseResponse {
  id: string;
  [key: string]: unknown;
}

// Get CCD API URL - use getter to ensure config is evaluated at call time
const getCcdApiUrl = () => config.ccdDataStoreApi;

/**
 * Retry configuration for CCD eventual consistency.
 */
const isPipeline = process.env.CI || process.env.ENVIRONMENT_NAME === 'aat';
const CCD_RETRY_CONFIG = {
  maxRetries: isPipeline ? 8 : 5,           // 8 retries in pipeline
  initialDelayMs: isPipeline ? 3000 : 2000, // Long initial wait
  maxDelayMs: 15000,                        // Cap at 15s per attempt
  retryableStatusCodes: [404]               // CaseNotFoundException
};

// Helper to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class CcdApi {

  async getStartEventToken(
    ccdStartCasePath: string,
    ccdSaveCasePath: string,
    authToken: string,
    serviceToken: string
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= CCD_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const startCaseResponse = await axiosRequest<{ token: string }>({
          method: 'get',
          url: getCcdApiUrl() + ccdStartCasePath,
          headers: {
            Authorization: `Bearer ${authToken}`,
            ServiceAuthorization: `Bearer ${serviceToken}`,
            'Content-Type': 'application/json'
          }
        });
        return startCaseResponse.data.token;
      } catch (error: unknown) {
        const parsedError =
          error instanceof Error
            ? (error as Error & { response?: { status?: number } })
            : new Error(String(error));

        lastError = parsedError;

        const statusCode =
          parsedError.response?.status ??
          parsedError.message.match(/status (\d+)/)?.[1];

        const is404 =
          statusCode === 404 ||
          statusCode === '404' ||
          parsedError.message.includes('No case found') ||
          parsedError.message.includes('CaseNotFoundException');

        if (is404 && attempt < CCD_RETRY_CONFIG.maxRetries) {
          const delayMs = Math.min(
            CCD_RETRY_CONFIG.initialDelayMs * Math.pow(1.5, attempt),
            CCD_RETRY_CONFIG.maxDelayMs
          );

          // eslint-disable-next-line no-console
          console.log(
            `[CCD Retry] 404 Not Found (attempt ${attempt + 1}/${CCD_RETRY_CONFIG.maxRetries + 1}). ` +
            `Case not yet consistent in DB. Waiting ${Math.round(delayMs)}ms...`
          );

          await wait(delayMs);
          continue;
        }

        throw parsedError;
      }
    }

    throw lastError ?? new Error('Failed to get CCD start event token');
  }

  async saveCase(
    ccdSaveCasePath: string,
    authToken: string,
    serviceToken: string,
    payload: CcdEventPayload
  ): Promise<AxiosResponse<CcdCaseResponse>> {
    return axiosRequest<CcdCaseResponse>({
      url: getCcdApiUrl() + ccdSaveCasePath,
      method: 'post',
      data: payload,
      headers: {
        Authorization: `Bearer ${authToken}`,
        ServiceAuthorization: `Bearer ${serviceToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createCaseInCcd(
    userName: string,
    password: string,
    dataLocation: string,
    caseType: string,
    eventId: string,
    dataModifications: ReplacementAction[] = []
  ): Promise<string> {
    if (!process.env.CI) {
      // eslint-disable-next-line no-console
      console.info('Creating CCD case with event %s...', eventId);
    }
    const authToken = await getUserToken(userName, password);
    const userId = await getUserId(authToken, userName);
    const serviceToken = await getServiceToken();

    const ccdStartCasePath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${caseType}/event-triggers/${eventId}/token`;
    const ccdSaveCasePath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${caseType}/cases`;

    const eventToken = await this.getStartEventToken(
      ccdStartCasePath,
      ccdSaveCasePath,
      authToken,
      serviceToken
    );

    const rawData = readFileSync(path.resolve(dataLocation), 'utf-8');
    const data = updateJsonFileWithEnvValues(rawData) as Record<string, JsonValue>;

    this.makeModifications(dataModifications, data);

    const payload: CcdEventPayload = {
      data,
      event: {
        id: eventId,
        summary: 'Creating Basic Case',
        description: 'For CCD E2E Test'
      },
      event_token: eventToken
    };

    const saveCaseResponse = await this.saveCase(
      ccdSaveCasePath,
      authToken,
      serviceToken,
      payload
    );
    const caseId = saveCaseResponse.data.id;
    
    // eslint-disable-next-line no-console
    console.info('Created case with id %s for event %s', caseId, eventId);

    // Give the system 2secs to replicate after creation before returning
    if (isPipeline) {
        await wait(2000); 
    }

    return caseId;
  }

  async updateCaseInCcd(
    userName: string,
    password: string,
    caseId: string,
    caseType: string,
    eventId: string,
    dataLocation: string,
    replacements: ReplacementAction[] = []
  ): Promise<CcdCaseResponse> {
    if (!process.env.CI) {
      // eslint-disable-next-line no-console
      console.info('Updating CCD case id %s with event %s...', caseId, eventId);
    }

    const authToken = await getUserToken(userName, password);
    const userId = await getUserId(authToken, userName);
    const serviceToken = await getServiceToken();

    const ccdStartEventPath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${caseType}/cases/${caseId}/event-triggers/${eventId}/token`;
    const ccdSaveEventPath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${caseType}/cases/${caseId}/events`;

    const eventToken = await this.getStartEventToken(
      ccdStartEventPath,
      ccdSaveEventPath,
      authToken,
      serviceToken
    );

    const rawData = dataLocation
      ? readFileSync(path.resolve(dataLocation), 'utf-8')
      : '{}';

    const updatedDataObj = updateJsonFileWithEnvValues(rawData) as Record<string, JsonValue>;

    this.makeModifications(replacements, updatedDataObj);

    const payload: CcdEventPayload = {
      data: updatedDataObj,
      event: {
        id: eventId,
        summary: 'Updating Case',
        description: 'For CCD E2E Test'
      },
      event_token: eventToken
    };
    
    const saveCaseResponse = await this.saveCase(
      ccdSaveEventPath,
      authToken,
      serviceToken,
      payload
    );
    
    if (!process.env.CI) {
      // eslint-disable-next-line no-console
      console.info('Updated case with id %s and event %s', caseId, eventId);
    }
    return saveCaseResponse?.data;
  }

  async updateCaseInCcdFromJSONObject(
    userName: string,
    password: string,
    caseId: string,
    caseType: string,
    eventId: string,
    jsonObject: Record<string, JsonValue>,
    shareCaseRef?: string
  ): Promise<CcdCaseResponse> {
    if (!process.env.CI) {
      // eslint-disable-next-line no-console
      console.info('Updating CCD case id %s with event %s (from JSON object)...', caseId, eventId);
    }

    const authToken = await getUserToken(userName, password);
    const userId = await getUserId(authToken, userName);
    const serviceToken = await getServiceToken();

    const ccdStartEventPath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${caseType}/cases/${caseId}/event-triggers/${eventId}/token`;
    const ccdSaveEventPath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${caseType}/cases/${caseId}/events`;

    const eventToken = await this.getStartEventToken(
      ccdStartEventPath,
      ccdSaveEventPath,
      authToken,
      serviceToken
    );

    let updatedData = JSON.stringify(jsonObject);
    updatedData = JSON.stringify(updateJsonFileWithEnvValues(updatedData) as Record<string, JsonValue>);

    if (shareCaseRef) {
      updatedData = updatedData.replace('ReplaceForShareCase', shareCaseRef);
    }

    const payload: CcdEventPayload = {
      data: JSON.parse(updatedData),
      event: {
        id: `${eventId}`,
        summary: 'Updating Case',
        description: 'For CCD E2E Test'
      },
      event_token: eventToken
    };

    const saveCaseResponse = await this.saveCase(
      ccdSaveEventPath,
      authToken,
      serviceToken,
      payload
    );
    
    if (!process.env.CI) {
      // eslint-disable-next-line no-console
      console.info('Updated case with id %s and event %s', caseId, eventId);
    }
    return saveCaseResponse.data;
  }

   /**
   * Applies modifications to JSON object based on the provided actions. 
   */
  makeModifications(dataModifications: ReplacementAction[], data: Record<string, JsonValue>): void {
    if (Array.isArray(dataModifications)) {
      dataModifications.forEach((modification) => {
        const { action, key, value } = modification;
        if (!key) {return;}

        if (action === 'delete') {
          unset(data, key);
        } else if (action === 'insert' && value !== undefined) {
          set(data, key, value);
        } else if (action === 'replace' && value !== undefined) {
          // Replace placeholder strings in entire JSON structure
          this.replaceInObject(data, key, value);
        }
      });
    }
  }

    /**
   * Replace placeholder strings in an object
   */
  private replaceInObject(obj: Record<string, JsonValue>, placeholder: string, replacement: JsonValue): void {
    if (typeof obj !== 'object' || obj === null) {return;}
    
    for (const prop in obj) {
      if (typeof obj[prop] === 'string' && obj[prop] === placeholder) {
        obj[prop] = replacement;
      } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        this.replaceInObject(obj[prop] as Record<string, JsonValue>, placeholder, replacement);
      }
    }
  }
}

export const ccdApi = new CcdApi();