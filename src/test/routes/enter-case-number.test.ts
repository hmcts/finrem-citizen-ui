import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import { RouteNames } from '../../main/route-names';

import { app } from '../../main/app';

describe('Enter Case Number page', () => {
  describe('on GET /enter-case-number', () => {
    test('should redirect to login when not authenticated', async () => {
      const res = await request(app).get(RouteNames.enterCaseNumber);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/login');
    });
  });

  describe('on POST /enter-case-number', () => {
    test('should redirect to oauth2/login when not authenticated with valid format', async () => {
      const res = await request(app).post(RouteNames.enterCaseNumber).send({ caseNumber: '1234567890123456' }).expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/oauth2/login');
    });

    test('should redirect to enter-case-number for validation errors', async () => {
      const res = await request(app).post(RouteNames.enterCaseNumber).send({ caseNumber: '' }).expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(RouteNames.enterCaseNumber);
    });
  });
});
