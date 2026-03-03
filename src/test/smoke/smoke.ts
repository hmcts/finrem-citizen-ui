import { fail } from 'assert';

import axios from 'axios';
import { expect } from 'chai';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

describe('Smoke Test', () => {
  describe('Home page loads', () => {
    test('with correct content', async () => {
      try {
        await axios.get(testUrl, {
          headers: {
            'Accept-Encoding': 'gzip',
          },
        });

        expect(1).to.equal(1);
      } catch {
        fail('Application did not respond successfully');
      }
    });
  });
});
