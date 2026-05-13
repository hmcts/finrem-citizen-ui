/// <reference types="node" />
import { describe, expect, test } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

const axiosConfig = {
  headers: { 'Accept-Encoding': 'gzip' },
  maxRedirects: 0,
  validateStatus: (status: number) => [200, 302].includes(status),
};

type SmokePage = {
  name: string;
  path: string;
  expectsLoginRedirect?: boolean;
};

const pages: SmokePage[] = [
  { name: 'Home', path: '/', expectsLoginRedirect: true },
  { name: 'Enter Case Number', path: '/enter-case-number', expectsLoginRedirect: true },
  { name: 'Enter Access Code', path: '/enter-access-code', expectsLoginRedirect: true },
  { name: 'Dashboard', path: '/dashboard', expectsLoginRedirect: true },
  { name: 'Task List Upload Dashboard', path: '/task-list-upload-dashboard', expectsLoginRedirect: true },
  { name: 'Documents', path: '/documents', expectsLoginRedirect: true },
  { name: 'Upload Journey Start', path: '/upload', expectsLoginRedirect: true },
  { name: 'Before You Start', path: '/upload/before-you-start', expectsLoginRedirect: true },
  { name: 'Confidentiality Guidance', path: '/upload/confidentiality', expectsLoginRedirect: true },
  { name: 'FDR', path: '/upload/fdr', expectsLoginRedirect: true },
  { name: 'Autocomplete Demo', path: '/demo/autocomplete' },
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

function assertSuccessfulPageResponse(response: AxiosResponse, expectsLoginRedirect = false): void {
  expect([200, 302]).toContain(response.status);

  if (response.status === 302) {
    const location = response.headers.location;
    expect(location).toBeDefined();

    const redirectPath = new URL(location as string, testUrl).pathname;
    if (expectsLoginRedirect) {
      expect(redirectPath).toMatch(/^\/login(?:\/|$)/i);
    } else {
      expect(redirectPath).not.toMatch(/^\/login(?:\/|$)/i);
    }
    expect(redirectPath).not.toMatch(/^\/(error|500|404)(?:\/|$)/i);
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
  test.each(pages)('$name page is reachable and valid', async ({ path, expectsLoginRedirect }) => {
    const response = await axios.get(`${testUrl}${path}`, axiosConfig);
    assertSuccessfulPageResponse(response, expectsLoginRedirect);
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
