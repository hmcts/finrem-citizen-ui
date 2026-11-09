/// <reference types="node" />
import { describe, expect, test } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';

import { PrivateRoutes, PublicRoutes, RouteNames, UploadStepNames } from '../../main/constants';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

const axiosConfig = {
  headers: { 'Accept-Encoding': 'gzip' },
  maxRedirects: 0,
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
  { name: 'Cookies', path: PublicRoutes.cookies },
  { name: 'Autocomplete', path: PrivateRoutes.autocomplete, expectedStatuses: [303], expectedRedirectPath: RouteNames.timedOut, },
  { name: 'Enter Case Number', path: PrivateRoutes.enterCaseNumber, expectedStatuses: [303], expectedRedirectPath: RouteNames.timedOut, },
  { name: 'Enter Access Code', path: PrivateRoutes.enterAccessCode, expectedStatuses: [303], expectedRedirectPath: RouteNames.timedOut, },
  { name: 'Dashboard', path: PrivateRoutes.dashboard, expectedStatuses: [303], expectedRedirectPath: RouteNames.timedOut, },
  { name: 'Task List Upload Dashboard', path: PrivateRoutes.taskListUpload, expectedStatuses: [303], expectedRedirectPath: RouteNames.timedOut, },
  {
    name: 'Previously Uploaded Documents',
    path: `${PrivateRoutes.uploadJourney}/previously-uploaded-documents`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
  },
  { name: 'Upload Journey Start', path: PrivateRoutes.uploadJourney, expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut },
  {
    name: 'Before You Start',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.BeforeYouStart}`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
  },
  {
    name: 'Confidentiality Guidance',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.Confidentiality}`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
  },
  {
    name: 'Hearing (FDR)',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.FDR}`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
  },
  {
    name: 'Document Type Selection',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.DocumentTypeSelection}`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
  },
  {
    name: 'Upload Documents',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.UploadDocuments}`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
  },
  {
    name: 'Check Upload',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.CheckUpload}`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
  },
  {
    name: 'Send To Other Party',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.SendToOtherParty}`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
  },
  {
    name: 'Case Submission (Confirmation)',
    path: `${PrivateRoutes.uploadJourney}/${UploadStepNames.Confirmation}`,
    expectedStatuses: [303],
    expectedRedirectPath: RouteNames.timedOut,
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

  if (response.status === 302 || response.status === 303) {
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

describe('Smoke Test - Page Availability', () => {
  test.each(pages)('$name page is reachable and valid', async page => {
    const { path } = page;
    const expectedStatuses = page.expectedStatuses ?? [200, 302];
    const response = await axios.get(`${testUrl}${path}`, {
      ...axiosConfig,
      validateStatus: (status: number) => expectedStatuses.includes(status),
    });
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
