import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PublicRoutes } from '../../../main/common-constants';

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

  test('GET /login renders login page or redirects to OIDC', async () => {
    const res = await request(app).get(PublicRoutes.login);

    // Either renders login form (200) or redirects to OIDC provider (302/303)
    expect([200, 302, 303]).toContain(res.status);
  });

  test('GET /logout redirects to IDAM sign-out', async () => {
    const res = await request(app).get(PublicRoutes.logout);

    // Redirect to IDAM sign-out (302/303 are typical redirect codes)
    expect([302, 303]).toContain(res.status);
    expect(res.header.location).toBeTruthy();
  });

  test('GET /oauth2/callback without code parameter redirects or returns server error', async () => {
    const res = await request(app).get(PublicRoutes.callbackUrl);

    // Missing code param should redirect back to login or return 500 if callback handler fails
    expect([302, 500]).toContain(res.status);
  });
});
