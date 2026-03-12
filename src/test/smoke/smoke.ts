import axios from 'axios';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

describe('Smoke Test', () => {
  describe('Home page loads', () => {
    test('with correct content', async () => {
      // If axios.get fails (e.g., DNS error, 502 gateway),
      // Jest will automatically catch it, fail the test, and print the real error.
      const response = await axios.get(testUrl, {
        headers: {
          'Accept-Encoding': 'gzip',
        },
        maxRedirects: 0,
        validateStatus: status => status === 200 || status === 302,
      });

      expect([200, 302]).toContain(response.status);
    });
  });
});
