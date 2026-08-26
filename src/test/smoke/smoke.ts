/// <reference types="node" />
import { describe, expect, test } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';

import { PrivateRoutes, PublicRoutes, UploadStepNames } from '../../main/common-constants';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

const axiosConfig = {
  headers: { 'Accept-Encoding': 'gzip' },
  maxRedirects: 0,
  timeout: 20_000,
};

type SmokePage = {
  name: string;
  path: string;
  expectedStatuses?: number[];
  expectsLoginRedirect?: boolean;
  expectedRedirectPath?: string;
  responseKind?: 'html' | 'json';
};

const pages: SmokePage[] = [
  { name: 'Home', path: PublicRoutes.basePath, expectsLoginRedirect: true },
  { name: 'Health', path: PublicRoutes.health, expectedStatuses: [200, 503], responseKind: 'json' },
  { name: 'Info', path: PublicRoutes.info, responseKind: 'json' },
  { name: 'Autocomplete', path: PrivateRoutes.autocomplete, expectsLoginRedirect: true },
  { name: 'Enter Case Number', path: PrivateRoutes.enterCaseNumber, expectsLoginRedirect: true },
  { name: 'Enter Access Code', path: PrivateRoutes.enterAccessCode, expectsLoginRedirect: true },
  { name: 'Dashboard', path: PrivateRoutes.dashboard, expectsLoginRedirect: true },
  { name: 'Task List Upload Dashboard', path: PrivateRoutes.taskListUpload, expectsLoginRedirect: true },
  {
    name: 'Previously Uploaded Documents',
    path: `${PrivateRoutes.uploadJourney}/previously-uploaded-documents`,
    expectsLoginRedirect: true,
  },
  { name: 'Upload Journey Start', path: PrivateRoutes.uploadJourney, expectsLoginRedirect: true },
  {
    name: 'Before You Start',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.BeforeYouStart}`,
    expectsLoginRedirect: true,
  },
  {
    name: 'Confidentiality Guidance',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.Confidentiality}`,
    expectsLoginRedirect: true,
  },
  {
    name: 'Hearing (FDR)',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.FDR}`,
    expectsLoginRedirect: true,
  },
  {
    name: 'Document Type Selection',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.DocumentTypeSelection}`,
    expectsLoginRedirect: true,
  },
  {
    name: 'Upload Documents',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.UploadDocuments}`,
    expectsLoginRedirect: true,
  },
  {
    name: 'Check Upload',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.CheckUpload}`,
    expectsLoginRedirect: true,
  },
  {
    name: 'Send To Other Party',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.SendToOtherParty}`,
    expectsLoginRedirect: true,
  },
  {
    name: 'Case Submission (Confirmation)',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.Confirmation}`,
    expectsLoginRedirect: true,
  },
  ...(process.env.NODE_ENV === 'production'
    ? []
    : [{ name: 'Config', path: PublicRoutes.config, responseKind: 'json' as const }]),
];

function getContentTypeHeader(response: AxiosResponse): string {
  const contentType = response.headers['content-type'];

  if (Array.isArray(contentType)) {
    return contentType
      .filter(value => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
      .map(value => `${value}`)
      .join(';');
  }

  if (typeof contentType === 'string' || typeof contentType === 'number' || typeof contentType === 'boolean') {
    return `${contentType}`;
  }

  return '';
}

function assertSuccessfulPageResponse(response: AxiosResponse, page: SmokePage): void {
  const expectedStatuses = page.expectedStatuses ?? [200, 302];
  expect(expectedStatuses).toContain(response.status);

  if (response.status === 302) {
    const location = response.headers.location;
    expect(location).toBeDefined();

    const redirectPath = new URL(location as string, testUrl).pathname;
    if (page.expectedRedirectPath) {
      expect(redirectPath).toBe(page.expectedRedirectPath);
    } else if (page.expectsLoginRedirect) {
      expect(redirectPath).toMatch(/^\/login(?:\/|$)/i);
    } else {
      expect(redirectPath).not.toMatch(/^\/login(?:\/|$)/i);
    }
    expect(redirectPath).not.toMatch(/^\/(error|500|404)(?:\/|$)/i);
    return;
  }

  if (page.responseKind === 'json') {
    expect(getContentTypeHeader(response)).toContain('json');
    expect(JSON.stringify(response.data).length).toBeGreaterThan(2);
    return;
  }

  expect(getContentTypeHeader(response)).toContain('text/html');
  expect(typeof response.data).toBe('string');

  const body = response.data as string;
  expect(body.length).toBeGreaterThan(100);
  expect(body).toContain('<title>');
  expect(body).not.toContain('Cannot GET');
}

function isTransientAxiosError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const code = error.code || '';
  return ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code);
}

async function getWithRetry(url: string, expectedStatuses: number[], attempts = 2): Promise<AxiosResponse> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await axios.get(url, {
        ...axiosConfig,
        validateStatus: (status: number) => expectedStatuses.includes(status),
      });
    } catch (error) {
      lastError = error;
      if (!isTransientAxiosError(error) || attempt === attempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  throw lastError;
}

describe('Smoke Test - Page Availability', () => {
  test.each(pages)('$name page is reachable and valid', async page => {
    const { path } = page;
    const expectedStatuses = page.expectedStatuses ?? [200, 302];
    const response = await getWithRetry(`${testUrl}${path}`, expectedStatuses);
    assertSuccessfulPageResponse(response, page);
  });

  test('Not found page returns 404', async () => {
    const response = await axios.get(`${testUrl}/this-page-does-not-exist`, {
      headers: { 'Accept-Encoding': 'gzip' },
      maxRedirects: 0,
      validateStatus: (status: number) => status === 404,
    });

    expect(response.status).toBe(404);
    expect(getContentTypeHeader(response)).toContain('text/html');
    expect(response.data).toContain('Page not found');
  });
});
