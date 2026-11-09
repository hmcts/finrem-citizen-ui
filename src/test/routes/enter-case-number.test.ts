import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';
import { RouteNames } from '../../main/constants';

describe('Enter Case Number page', () => {
  describe('on GET /enter-case-number', () => {
    test('should redirect to login when not authenticated', async () => {
      const res = await request(app).get('/enter-case-number');

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(RouteNames.login);
    });
  });

  describe('on POST /enter-case-number', () => {
    test('should redirect to login when not authenticated with valid format', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '1234567890123456' })
        .expect(302);

      expect(res.header.location).toBe(RouteNames.login);
    });

    test('should redirect to login before validation when not authenticated', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '' })
        .expect(302);

      expect(res.header.location).toBe(RouteNames.login);
    });
  });
});
