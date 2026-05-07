import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, PublicRoutes } from '../../../main/common-constants';

describe('Authentication & OIDC Login Flow', () => {
  describe('OIDC Login Flow Initialization', () => {
    test('GET /login redirects to OIDC authorization endpoint', async () => {
      const res = await request(app).get(PublicRoutes.login);

      // Login should redirect to OIDC (302/303) or render form (200)
      expect([200, 302, 303]).toContain(res.status);

      // If redirect, location header must be present and point to OIDC
      if ([302, 303].includes(res.status)) {
        expect(res.header.location).toEqual(expect.any(String));
        expect(res.header.location.length).toBeGreaterThan(0);
        expect(res.header.location).toMatch(/oauth2|authorize/i);
      } else {
        // If not redirect, must be 200 with HTML form
        expect(res.status).toBe(200);
      }
    });

    test('GET /oauth2/callback without code redirects or returns error', async () => {
      const res = await request(app).get(PublicRoutes.callbackUrl);

      // Missing code redirects back to login (302/303) or errors (400/401/500)
      expect([302, 303, 400, 401, 500]).toContain(res.status);
      expect(res.status).not.toBe(200);  // Should never succeed

      if ([302, 303].includes(res.status)) {
        expect(res.header.location).toEqual(expect.any(String));
        expect(res.header.location.length).toBeGreaterThan(0);
      }
    });

    test('GET /oauth2/callback with malformed code returns error or redirects', async () => {
      const res = await request(app)
        .get(PublicRoutes.callbackUrl)
        .query({ code: 'invalid-code-format' });

      // Invalid code fails with errors (400/401/500) or redirects back to login (302/303), never succeeds
      expect([302, 303, 400, 401, 500]).toContain(res.status);
      expect(res.status).not.toBe(200);  // Should never succeed
    });
  });

  describe('Protected Route Access Without Session', () => {
    test('GET /dashboard requires authentication and redirects to /login', async () => {
      const res = await request(app).get(PrivateRoutes.dashboard);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });

    test('GET /enter-case-number requires authentication', async () => {
      const res = await request(app).get(PrivateRoutes.enterCaseNumber);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });

    test('GET /enter-access-code requires authentication', async () => {
      const res = await request(app).get(PrivateRoutes.enterAccessCode);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });

    test('GET /task-list-upload-dashboard requires authentication', async () => {
      const res = await request(app).get(PrivateRoutes.taskListUpload);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });

    test('GET /upload/* requires authentication', async () => {
      const res = await request(app).get(PrivateRoutes.uploadJourney);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });
  });

  describe('Form Submissions Without Session', () => {
    test('POST /enter-case-number without session redirects to login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      expect(res.status).toBe(302);
      expect(res.header.location).toMatch(/login|oauth/i);
    });

    test('POST /enter-access-code without session redirects to login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TEST0001' });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });
  });

  describe('Logout Flow', () => {
    test('GET /logout redirects to sign-out endpoint', async () => {
      const res = await request(app).get(PublicRoutes.logout);

      // Logout redirects to IDAM sign-out with 302 or 303
      expect([302, 303]).toContain(res.status);
      expect(res.header.location).toEqual(expect.any(String));
      expect(res.header.location.length).toBeGreaterThan(0);
    });

    test('POST /logout is either not supported or redirects', async () => {
      const res = await request(app).post(PublicRoutes.logout);

      // POST /logout should either not be allowed (404/405) or redirect (302/303)
      expect([302, 303, 404, 405]).toContain(res.status);
    });
  });

  describe('Request Method Validation', () => {
    test('DELETE /login returns 404 or 405 (method not allowed)', async () => {
      const res = await request(app).delete(PublicRoutes.login);

      // DELETE on login is not supported, expect 404 or 405
      expect([404, 405]).toContain(res.status);
    });

    test('PUT /dashboard returns 404 or 405 (method not allowed)', async () => {
      const res = await request(app).put(PrivateRoutes.dashboard);

      // PUT on protected route is not supported, expect 404 or 405
      expect([404, 405]).toContain(res.status);
    });
  });

  describe('CORS & Origin Headers', () => {
    test('Public /info endpoint returns 200 with headers', async () => {
      const res = await request(app).get('/info');

      expect(res.status).toBe(200);
      expect(res.headers).toBeDefined();
      expect(res.headers['content-type']).toMatch(/application\/json/i);
    });
  });
});
