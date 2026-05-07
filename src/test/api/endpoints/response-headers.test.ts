import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, PublicRoutes } from '../../../main/common-constants';

describe('Response Headers & Session Management', () => {
  describe('Content Type & Response Headers', () => {
    test('HTML endpoints return appropriate content-type', async () => {
      const res = await request(app).get(PublicRoutes.login);

      // Login can redirect to OIDC (302/303) or render login form (200)
      expect([200, 302, 303]).toContain(res.status);
      
      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(/text\/html/i);
      }
    });

    test('API /info endpoint returns JSON with proper headers', async () => {
      const res = await request(app).get('/info');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/i);
    });

    test('Redirects include Location header with valid path or URL', async () => {
      const res = await request(app).get(PrivateRoutes.dashboard);

      // Dashboard redirect to OIDC is expected when not authenticated
      expect([302, 303]).toContain(res.status);
      expect(res.header.location).toBeTruthy();
      // Location can be absolute URL (https://...) or relative path (/login)
      expect(res.header.location).toMatch(/^(https?:\/\/|\/)/);
    });
  });

  describe('Security Headers', () => {
    test('Responses include Helmet security headers', async () => {
      const res = await request(app).get('/info');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeTruthy();
    });

    test('Protected routes require authentication or redirect', async () => {
      const res = await request(app).post(PrivateRoutes.enterAccessCode).send({});

      // Should redirect to login (302/303) or return 401, not 500 or 200
      expect([302, 303, 400, 401]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });
  });

  describe('Session & Cookie Management', () => {
    test('Login endpoint returns session cookie in Set-Cookie header', async () => {
      const res = await request(app).get(PublicRoutes.login);

      expect([200, 302, 303]).toContain(res.status);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/connect\.sid|session/i),
        ])
      );
    });

    test('Multiple requests receive different session IDs', async () => {
      const res1 = await request(app).get(PublicRoutes.login);
      const res2 = await request(app).get(PublicRoutes.login);

      expect(res1.headers['set-cookie']).toBeDefined();
      expect(res2.headers['set-cookie']).toBeDefined();
      expect(res1.headers['set-cookie']).not.toEqual(res2.headers['set-cookie']);
    });
  });
});
