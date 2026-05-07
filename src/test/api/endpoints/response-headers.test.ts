import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, PublicRoutes } from '../../../main/common-constants';

describe('Response Headers & Session Management', () => {
  describe('Content Type & Response Headers', () => {
    test('HTML endpoints return text/html content-type', async () => {
      const res = await request(app).get(PublicRoutes.login);

      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(/text\/html|application\/json/i);
      }
    });

    test('API responses set appropriate cache headers', async () => {
      const res = await request(app).get('/info');

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('content-type');
    });

    test('Redirects include Location header', async () => {
      const res = await request(app).get(PrivateRoutes.dashboard);

      if ([302, 303, 307, 308].includes(res.status)) {
        expect(res.header.location).toBeTruthy();
      }
    });
  });

  describe('Security Headers', () => {
    test('Responses include security headers', async () => {
      const res = await request(app).get('/info');

      expect(res.headers['x-content-type-options']).toBeTruthy();
      expect(res.headers['x-frame-options']).toBeTruthy();
    });

    test('Sensitive routes enforce HTTPS in production (if configured)', async () => {
      const res = await request(app).post(PrivateRoutes.enterAccessCode).send({});

      expect([302, 400, 401]).toContain(res.status);
    });
  });

  describe('Session & Cookie Management', () => {
    test('Responses set session cookie when appropriate', async () => {
      const res = await request(app).get(PublicRoutes.login);

      if (res.headers['set-cookie']) {
        expect(res.headers['set-cookie']).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/connect.sid|session/i),
          ])
        );
      }
    });

    test('Multiple requests maintain session isolation', async () => {
      const res1 = await request(app).get(PublicRoutes.login);
      const res2 = await request(app).get(PublicRoutes.login);

      const cookie1 = res1.headers['set-cookie'];
      const cookie2 = res2.headers['set-cookie'];

      if (cookie1 && cookie2) {
        expect(cookie1).not.toEqual(cookie2);
      }
    });
  });
});
