import { describe, expect, test } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

describe('Smoke Test', () => {
  describe('Home page loads', () => {
    test('with correct content', async () => {
      try {
        const response: AxiosResponse = await axios.get(testUrl, {
          headers: {
            'Accept-Encoding': 'gzip',
          },
        });

        expect(response.data).toContain('<h1 class="govuk-heading-xl">Default page template</h1>');
      } catch (error) {
        throw new Error(`Smoke test failed: Heading not present or server unreachable. ${(error as Error).message}`);
      }
    });
  });
});
