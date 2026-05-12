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
};

const pages: SmokePage[] = [
  { name: 'Home', path: '/' },
  { name: 'Enter Case Number', path: '/enter-case-number' },
  { name: 'Enter Access Code', path: '/enter-access-code' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Task List Upload Dashboard', path: '/task-list-upload-dashboard' },
  { name: 'Documents', path: '/documents' },
  { name: 'Upload Journey Start', path: '/upload' },
  { name: 'Before You Start', path: '/upload/before-you-start' },
  { name: 'Confidentiality Guidance', path: '/upload/confidentiality' },
  { name: 'FDR', path: '/upload/fdr' },
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

function assertSuccessfulPageResponse(response: AxiosResponse): void {
  expect([200, 302]).toContain(response.status);

  if (response.status === 302) {
    expect(response.headers.location).toBeDefined();
    return;
  }

  expect(getContentTypeHeader(response)).toContain('text/html');
  expect(typeof response.data).toBe('string');

  const body = response.data as string;
  expect(body.length).toBeGreaterThan(100);
  expect(body).toContain('<title>');
  expect(body).not.toContain('Cannot GET');
  expect(body).not.toContain('Internal Server Error');
}

describe('Smoke Test - Page Availability', () => {
  test.each(pages)('$name page is reachable and valid', async ({ path }) => {
    const response = await axios.get(`${testUrl}${path}`, axiosConfig);
    assertSuccessfulPageResponse(response);
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
