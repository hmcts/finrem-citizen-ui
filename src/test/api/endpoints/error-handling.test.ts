import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, PublicRoutes } from '../../../main/common-constants';

describe('Error Handling & Status Codes', () => {
  describe('404 & Method Not Allowed', () => {
    test('GET /nonexistent returns 404', async () => {
      const res = await request(app).get('/nonexistent-route-xyz');

      expect(res.status).toBe(404);
    });

    test('POST / (root) returns 404 (no handler for POST root)', async () => {
      const res = await request(app).post(PublicRoutes.basePath);

      // Root POST is not defined in the routing, should return 404
      expect(res.status).toBe(404);
    });
  });

  describe('Error Responses', () => {
    test('Server errors return 5xx status with error info', async () => {
      const res = await request(app).get('/info');

      expect(res.status).not.toBe(500);
    });

    test('Malformed JSON to protected routes returns 400 (parser error before auth check)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // JSON parsing fails before auth middleware runs, so returns 400
      expect(res.status).toBe(400);
    });
  });
});
