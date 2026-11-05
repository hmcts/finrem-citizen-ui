import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';
import { RouteNames } from '../../main/constants';

describe('Enter Case Number page', () => {
  describe('on GET /enter-case-number', () => {
    test('should redirect to timed-out page when not authenticated', async () => {
      const res = await request(app).get('/enter-case-number');

      expect(res.status).toBe(303);
      expect(res.header.location).toBe(RouteNames.timedOut);
    });
  });

  describe('on POST /enter-case-number', () => {
    test('should redirect to timed-out page when not authenticated with valid format', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '1234567890123456' })
        .expect(303);

      expect(res.header.location).toBe(RouteNames.timedOut);
    });

    test('should redirect to timed-out page before validation when not authenticated', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '' })
        .expect(303);

      expect(res.header.location).toBe(RouteNames.timedOut);
    });
  });
});
