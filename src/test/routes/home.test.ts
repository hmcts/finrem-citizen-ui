import request from 'supertest';

import { app } from '../../main/app';

describe('Home page', () => {
  describe('on GET', () => {
    test('should redirect to login when not authenticated', async () => {
      const res = await request(app).get('/').expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/login');
    });
  });
});
