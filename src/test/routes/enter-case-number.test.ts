import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';

describe('Enter Case Number page', () => {
  describe('on GET /enter-case-number', () => {
    test('should redirect to login when not authenticated', async () => {
      const res = await request(app).get('/enter-case-number');

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/login');
    });
  });

  describe('on POST /enter-case-number', () => {
    test('should redirect to login when not authenticated', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '1234567890123456' })
        .expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/login');
    });

    test('should redirect to login for validation errors when not authenticated', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '' })
        .expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/login');
    });
  });
});
