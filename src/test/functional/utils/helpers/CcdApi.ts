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

const parseNumberEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const shouldLogCcdProgress = (): boolean => process.env.CCD_LOG_PROGRESS === 'true';
const shouldLogVerboseRetry = (): boolean => process.env.CCD_VERBOSE_RETRY === 'true';

// Retry configuration for CCD eventual consistency.
//
// Why "Case not found" can appear even when tests pass:
// - Immediately after create/update, CCD reads and start-event token lookups can hit
//   a replica/index that has not caught up yet.
// - A short retry window smooths this transient lag without masking persistent failures.
const CCD_RETRY_CONFIG = {
  // Total attempts = maxRetries + 1. Default to 2 attempts to fail fast.
  maxRetries: parseNumberEnv(process.env.CCD_START_EVENT_MAX_RETRIES, 1),
  initialDelayMs: 2000,
  maxDelayMs: parseNumberEnv(process.env.CCD_START_EVENT_MAX_DELAY_MS, process.env.CI ? 4000 : 10000),
  retryableStatusCodes: [404]  // CaseNotFoundException - case not yet available
};

// Helper to wait with exponential backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class CcdApi {

  async getCaseData(
    userName: string,
    password: string,
    caseId: string,
    caseType: string
  ): Promise<CcdCaseResponse> {
    const authToken = await getUserToken(userName, password);
    const userId = await getUserId(authToken, userName);
    const serviceToken = await getServiceToken();

    const ccdGetCasePath = `/caseworkers/${userId}/jurisdictions/DIVORCE/case-types/${caseType}/cases/${caseId}`;

    const response = await axiosRequest<CcdCaseResponse>({
      method: 'get',
      url: getCcdApiUrl() + ccdGetCasePath,
      headers: {
        Authorization: `Bearer ${authToken}`,
        ServiceAuthorization: `Bearer ${serviceToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

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
      } catch (error) {
        lastError = error as Error;
        const errorMessage = lastError.message || '';

        // Retry only known transient "not yet visible" 404s that can happen right
        // after case creation/update due to CCD eventual consistency.
        const is404 = errorMessage.includes('status 404') ||
                      errorMessage.includes('No case found');

        if (is404 && attempt < CCD_RETRY_CONFIG.maxRetries) {
          const delayMs = Math.min(
            CCD_RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
            CCD_RETRY_CONFIG.maxDelayMs
          );

          const verboseRetryLogs = shouldLogVerboseRetry();
          const shouldLogRetry =
            verboseRetryLogs
            || (
              !!process.env.CI
              && (attempt === 0 || attempt === CCD_RETRY_CONFIG.maxRetries - 1)
            );

          if (shouldLogRetry) {
            // eslint-disable-next-line no-console
            console.log(`[CCD Retry] Case not found (attempt ${attempt + 1}/${CCD_RETRY_CONFIG.maxRetries + 1}), waiting ${delayMs}ms for CCD consistency...`);
          }
          await wait(delayMs);
          continue;
        }

        // Non-retryable error or max retries exceeded
        throw lastError;
      }
    }

    throw lastError!;
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
    if (shouldLogCcdProgress()) {
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
    if (shouldLogCcdProgress()) {
      // eslint-disable-next-line no-console
      console.info('Created case with id %s for event %s', caseId, eventId);
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
    if (shouldLogCcdProgress()) {
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

    // Apply the key-based mutations
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
    if (shouldLogCcdProgress()) {
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
    if (shouldLogCcdProgress()) {
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
    if (shouldLogCcdProgress()) {
      // eslint-disable-next-line no-console
      console.info('Updated case with id %s and event %s', caseId, eventId);
    }
    return saveCaseResponse.data;
  }

  /**
   * Applies modifications to a JSON object based on the provided actions.
   * Supports 'insert', 'delete', and 'replace' actions.
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
   * Recursively replace placeholder strings in an object
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

// Export singleton instance
export const ccdApi = new CcdApi();
