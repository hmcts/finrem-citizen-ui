/// <reference types="node" />
import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

const axiosConfig = {
  headers: { 'Accept-Encoding': 'gzip' },
  maxRedirects: 0,
  // We allow 200 (OK) or 302 (Redirect)
  validateStatus: (status: number) => status === 200 || status === 302,
};

describe('Smoke Test - Page Availability', () => {
  test('Home page loads', async () => {
    const response = await axios.get(`${testUrl}/`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('Enter Case Number page loads', async () => {
    const response = await axios.get(`${testUrl}/enter-case-number`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('Enter Access Code page loads', async () => {
    const response = await axios.get(`${testUrl}/enter-access-code`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('Dashboard page loads', async () => {
    const response = await axios.get(`${testUrl}/dashboard`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('Before You Start page loads', async () => {
    const response = await axios.get(`${testUrl}/upload/before-you-start`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('Confidentiality Guidance page loads', async () => {
    const response = await axios.get(`${testUrl}/upload/confidentiality`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('FDR page loads', async () => {
    const response = await axios.get(`${testUrl}/upload/fdr`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });

  test('Document Selection page loads', async () => {
    const response = await axios.get(`${testUrl}/upload/document-selection`, axiosConfig);
    expect([200, 302]).toContain(response.status);
  });
});
