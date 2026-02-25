import { beforeAll, describe, expect, test } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

describe('Smoke Test', () => {
  describe('Home page loads', () => {
    let response: AxiosResponse;

    beforeAll(async () => {
      try {
        response = await axios.get(testUrl, {
          headers: {
            'Accept-Encoding': 'gzip',
          },
        });
      } catch (error: unknown) {
        console.error(`Failed to fetch ${testUrl}:`);
        if (axios.isAxiosError(error)) {
          console.error(`Error message: ${error.message}`);
          if (error.code) {
            console.error(`Axios error code: ${error.code}`); // e.g., ECONNREFUSED, ETIMEDOUT
          }
          if (error.response) {
            console.error(`Server responded with status ${error.response.status}:`, error.response.data);
          }
        } else if (error instanceof Error) {
          console.error(`Error message: ${error.message}`);
        } else {
          console.error('An unexpected error occurred:', error);
        }
        throw error;
      }
    });

    test('with correct content', () => {
      expect(response.data).toContain('<h1 class="govuk-heading-xl">Default page template</h1>');
    });

    test('with correct header', () => {
      expect(response.data).toContain('<div class="govuk-header__logo">');
    });

    test('with correct footer and copyright', () => {
      expect(response.data).toContain('All content is available under the');
      expect(response.data).toMatch(
        /<a\s*class="govuk-footer__link"\s*href=".*?"\s*rel="license"\s*>Open Government Licence v3.0<\/a>/
      );
    });
  });
});
