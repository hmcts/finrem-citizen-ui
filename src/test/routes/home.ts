import request from 'supertest';

import { app } from '../../main/app';

describe('Home page', () => {
  describe('on GET', () => {
    test('should redirect to enter case number page', async () => {
      const res = await request(app).get('/').expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/enter-case-number');
    });
  });
});
