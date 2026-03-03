import { fail } from 'assert';

import axios from 'axios';
import { expect } from 'chai';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

describe('Smoke Test', () => {
  describe('Home page loads', () => {
    test('with correct content', async () => {
      try {
        const response = await axios.get(testUrl, {
          headers: {
            'Accept-Encoding': 'gzip',
          },
          maxRedirects: 0,
          validateStatus: status => status === 200 || status === 302,
        });

        expect(response.status).to.be.oneOf([200, 302]);
      } catch {
        fail('Application did not respond successfully');
      }
    });
  });
});
