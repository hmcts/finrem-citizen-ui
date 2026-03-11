import request from 'supertest';

import { app } from '../../main/app';

describe('Home page', () => {
  describe('on GET', () => {
    test('should respond', async () => {
      const response = await request(app).get('/');
      // Use Jest's native syntax instead of Chai
      expect([200, 302]).toContain(response.status);
    });
  });
});
