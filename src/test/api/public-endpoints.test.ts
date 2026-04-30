import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';
import { PublicRoutes } from '../../main/common-constants';

describe('Public Endpoints (No Authentication Required)', () => {
  test('GET /info returns build and runtime metadata', async () => {
    const res = await request(app).get(PublicRoutes.basePath + 'info');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/i);
    expect(res.body).toBeTruthy();
    expect(typeof res.body).toBe('object');
  });

  test('GET /health endpoints are reachable', async () => {
    const healthEndpoints = ['/health', '/health/liveness', '/health/readiness'];

    for (const endpoint of healthEndpoints) {
      const res = await request(app).get(endpoint);
      expect(res.status).not.toBe(404);
    }
  });

  test('GET /login redirects or renders login page', async () => {
    const res = await request(app).get(PublicRoutes.login);

    // Either redirects or returns 200 with content
    expect([200, 302, 303, 307, 308]).toContain(res.status);
  });

  test('GET /logout redirects to IDAM sign-out', async () => {
    const res = await request(app).get(PublicRoutes.logout);

    // Should redirect to IDAM logout or home
    expect([302, 303, 307, 308]).toContain(res.status);
    expect(res.header.location).toBeTruthy();
  });

  test('GET /oauth2/callback without code parameter returns error or redirects', async () => {
    const res = await request(app).get(PublicRoutes.callbackUrl);

    // Either 400 for missing params, redirect back to login, or server error
    expect([302, 400, 401, 500]).toContain(res.status);
  });
});
