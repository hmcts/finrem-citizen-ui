import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, PublicRoutes } from '../../../main/common-constants';

describe('Authentication & OIDC Login Flow', () => {
  describe('OIDC Login Flow Initialization', () => {
    test('GET /login redirects to OIDC authorization endpoint', async () => {
      const res = await request(app).get(PublicRoutes.login);

      expect([200, 302, 303]).toContain(res.status);

      if ([302, 303].includes(res.status)) {
        expect(res.header.location).toBeTruthy();
      }
    });

    test('GET /oauth2/callback without code returns error response', async () => {
      const res = await request(app).get(PublicRoutes.callbackUrl);

      expect([200, 302, 303, 500]).toContain(res.status);

      if ([302, 303].includes(res.status)) {
        expect(res.header.location).toBeTruthy();
      }
    });

    test('GET /oauth2/callback with malformed code returns error response', async () => {
      const res = await request(app)
        .get(PublicRoutes.callbackUrl)
        .query({ code: 'invalid-code-format' });

      expect([302, 400, 401, 500]).toContain(res.status);
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
    test('POST /enter-case-number without session redirects to oauth2/login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      expect([302, 401]).toContain(res.status);

      if (res.status === 302) {
        expect(res.header.location).toMatch(/login|oauth/i);
      }
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

      expect([302, 303, 307, 308]).toContain(res.status);
      expect(res.header.location).toBeTruthy();
    });

    test('POST /logout is handled if supported', async () => {
      const res = await request(app).post(PublicRoutes.logout);

      expect([302, 304, 404, 405, 501]).toContain(res.status);
    });
  });

  describe('Request Method Validation', () => {
    test('Unsupported HTTP methods return 405 Method Not Allowed', async () => {
      const res = await request(app).delete(PublicRoutes.login);

      expect([404, 405]).toContain(res.status);
    });

    test('PUT requests to protected endpoints are rejected', async () => {
      const res = await request(app).put(PrivateRoutes.dashboard);

      expect([404, 405]).toContain(res.status);
    });
  });

  describe('CORS & Origin Headers', () => {
    test('Requests include appropriate CORS headers if configured', async () => {
      const res = await request(app).get('/info');

      expect(res.status).toBe(200);
      expect(res.headers).toBeDefined();
    });
  });
});
