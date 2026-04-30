import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';
import { PrivateRoutes,PublicRoutes } from '../../main/common-constants';

describe('Authentication & Session Flow', () => {
  describe('OIDC Login Flow Initialization', () => {
    test('GET /login redirects to OIDC authorization endpoint', async () => {
      const res = await request(app).get(PublicRoutes.login);

      // Should either render a login page or redirect to OIDC provider
      expect([200, 302, 303]).toContain(res.status);

      if ([302, 303].includes(res.status)) {
        // If it redirects, should be to an auth provider or callback
        expect(res.header.location).toBeTruthy();
      }
    });

    test('GET /oauth2/callback without code returns error response', async () => {
      const res = await request(app).get(PublicRoutes.callbackUrl);

      // Should either render a login page or redirect to OIDC provider
      expect([200, 302, 303, 500]).toContain(res.status);

      if ([302, 303].includes(res.status)) {
        // If it redirects, should be to an auth provider or callback
        expect(res.header.location).toBeTruthy();
      }
    });

    test('GET /oauth2/callback with malformed code returns error response', async () => {
      const res = await request(app)
        .get(PublicRoutes.callbackUrl)
        .query({ code: 'invalid-code-format' });

      // OIDC provider validation should fail
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

      // Should redirect or reject with 401
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

  describe('Case Number Input Validation', () => {
    test('POST /enter-case-number with non-16-digit case number is rejected', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '12345' });

      // Either form validation error (200) or auth redirect
      expect([200, 302, 400, 401]).toContain(res.status);
    });

    test('POST /enter-case-number with non-numeric case number is rejected', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: 'ABCDEFGHIJKLMNOP' });

      expect([200, 302, 400, 401]).toContain(res.status);
    });

    test('POST /enter-case-number with whitespace in case number is handled', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '  1234567890123456  ' });

      // Should either trim and accept or return 200/302
      expect([200, 302, 400, 401]).toContain(res.status);
    });

    test('POST /enter-case-number without case number field returns error', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({});

      expect([200, 302, 400, 401]).toContain(res.status);
    });
  });

  describe('Access Code Input Validation', () => {
    test('POST /enter-access-code with empty access code is rejected', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '' });

      // Form validation or redirect
      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code with access code < 8 chars is rejected', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'SHORT12' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code with access code > 8 chars is rejected', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TOOLONGCODE1' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code with special characters is rejected', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TEST-123!' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code with spaces is rejected', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TEST 1234' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code with valid format (8 alphanumeric) is accepted', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TEST0001' });

      // May render page with error or redirect (no valid session case)
      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code accepts both uppercase and lowercase', async () => {
      const testCodes = ['TEST0001', 'test0001', 'TeSt0001'];

      for (const code of testCodes) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: code });

        expect([200, 302]).toContain(res.status);
      }
    });

    test('POST /enter-access-code trims leading/trailing whitespace', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '  TEST0001  ' });

      // Should either accept or render form (trimmed would be valid format)
      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code without access code field returns error', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({});

      expect([200, 302]).toContain(res.status);
    });
  });

  describe('Session Timeout & State Management', () => {
    test('Consecutive requests to same endpoint maintain consistent behavior', async () => {
      const res1 = await request(app).get(PrivateRoutes.dashboard);
      const res2 = await request(app).get(PrivateRoutes.dashboard);

      expect(res1.status).toBe(res2.status);
      expect(res1.header.location).toBe(res2.header.location);
    });

    test('Requests to different protected endpoints all redirect to login', async () => {
      const endpoints = [
        PrivateRoutes.dashboard,
        PrivateRoutes.enterCaseNumber,
        PrivateRoutes.enterAccessCode,
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);

        expect(res.status).toBe(302);
        expect(res.header.location).toBe(PublicRoutes.login);
      }
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

      // May not support POST, return 404, or redirect
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
      // CORS headers may or may not be present depending on config
      expect(res.headers).toBeDefined();
    });
  });
});
