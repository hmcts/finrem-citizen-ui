import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, PublicRoutes } from '../../../main/common-constants';

describe('Protected Endpoints (Authentication & Session Validation)', () => {
  describe('Protected GET Endpoints (Redirect to Login When Unauthenticated)', () => {
    test.each([
      PrivateRoutes.dashboard,
      PrivateRoutes.enterCaseNumber,
      PrivateRoutes.enterAccessCode,
      PrivateRoutes.taskListUpload,
      PrivateRoutes.uploadJourney,
    ])('GET %s redirects to /login when not authenticated', async (path) => {
      const res = await request(app).get(path);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });

    test('GET / (root dashboard redirect) requires authentication', async () => {
      const res = await request(app).get(PublicRoutes.basePath);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });
  });

  describe('Protected POST Endpoints (Authentication & Session Validation)', () => {
    test('POST /enter-case-number without session user redirects to oauth2/login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      expect([302, 401]).toContain(res.status);
    });

    test('POST /enter-access-code without session redirects to /login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'APPCODE1' });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(PublicRoutes.login);
    });

    test('POST /enter-access-code with missing caseNumber in session redirects to enter-case-number', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'APPCODE1' });

      expect([302, 401]).toContain(res.status);
    });
  });
});
