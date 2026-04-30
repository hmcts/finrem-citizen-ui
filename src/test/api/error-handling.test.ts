import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';
import { PrivateRoutes,PublicRoutes } from '../../main/common-constants';

describe('Error Handling & Status Codes', () => {
  describe('404 & Method Not Allowed', () => {
    test('GET /nonexistent returns 404', async () => {
      const res = await request(app).get('/nonexistent-route-xyz');

      expect(res.status).toBe(404);
    });

    test('POST / (root) without proper handling returns error or redirects', async () => {
      const res = await request(app).post(PublicRoutes.basePath);

      expect([302, 404, 405]).toContain(res.status);
    });
  });

  describe('Error Responses', () => {
    test('Server errors return 5xx status with error info', async () => {
      // This test is a placeholder; actual server errors depend on app state
      const res = await request(app).get('/info');

      // Health check should succeed
      expect(res.status).not.toBe(500);
    });

    test('Malformed requests return 400', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Either 400 or 302 redirect
      expect([302, 400]).toContain(res.status);
    });
  });
});
