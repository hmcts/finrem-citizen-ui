import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PublicRoutes } from '../../../main/common-constants';

describe('Public Endpoints (No Authentication Required)', () => {
  test('GET /info returns build and runtime metadata', async () => {
    const res = await request(app).get(PublicRoutes.basePath + 'info');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/i);

    // Validate response structure contains expected nested build info and extra build info
    expect(res.body).toEqual(
      expect.objectContaining({
        build: expect.objectContaining({
          version: expect.any(String),
        }),
        extraBuildInfo: expect.objectContaining({
          host: expect.any(String),
          name: expect.stringMatching(/expressjs-template|finrem-citizen-ui/),
          uptime: expect.any(Number),
        }),
      })
    );

    // Verify build version is a valid string (not empty)
    expect(res.body.build.version).toBeTruthy();

    // Verify extraBuildInfo values are valid
    expect(res.body.extraBuildInfo.host).toBeTruthy();
    expect(res.body.extraBuildInfo.uptime).toBeGreaterThan(0);
  });

  test('GET /health endpoints are reachable and return valid health status', async () => {
    const healthEndpoints = ['/health', '/health/liveness', '/health/readiness'];

    for (const endpoint of healthEndpoints) {
      const res = await request(app).get(endpoint);

      // Health endpoints should return either 200 (healthy) or 503 (unhealthy), never 404 or 500
      expect([200, 503]).toContain(res.status);
      expect(res.headers['content-type']).toMatch(/application\/json/i);

      // Response should be a JSON object with status information
      expect(res.body).toEqual(expect.any(Object));
      expect(typeof res.body).toBe('object');
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
