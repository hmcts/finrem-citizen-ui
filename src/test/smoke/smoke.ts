import { describe, expect, test } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

describe('Smoke Test', () => {
  test('Home page loads with correct content', async () => {
    const response: AxiosResponse = await axios.get(testUrl, {
      headers: { 'Accept-Encoding': 'gzip' },
    });

    expect(response.status).toBe(200);
    expect(response.data).toContain('<h1 class="govuk-heading-xl">Default page template</h1>');
  });
});
