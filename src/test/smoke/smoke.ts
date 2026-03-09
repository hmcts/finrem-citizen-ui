import { fail } from 'assert';

import axios from 'axios';

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

        // Replaced Chai's 'to.be.oneOf' with Jest's native 'toContain'
        expect([200, 302]).toContain(response.status);
      } catch {
        fail('Application did not respond successfully');
      }
    });
  });
});
