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
      
      // Always check content-type is set
      expect(res.headers['content-type']).toBeDefined();
      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(/text\/html/i);
        expect(res.text).toMatch(/<html|<!doctype html|form/i);
      } else if ([302, 303].includes(res.status)) {
        expect(res.header.location).toEqual(expect.any(String));
        expect(res.header.location.length).toBeGreaterThan(0);
      }
    });

    test('API /info endpoint returns JSON with proper headers', async () => {
      const res = await request(app).get('/info');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/i);
      expect(res.body).toEqual(
        expect.objectContaining({
          build: expect.objectContaining({
            version: expect.any(String),
          }),
          extraBuildInfo: expect.objectContaining({
            host: expect.any(String),
            name: expect.any(String),
            uptime: expect.any(Number),
          }),
        })
      );
    });

    test('Redirects include Location header with valid path or URL', async () => {
      const res = await request(app).get(PrivateRoutes.dashboard);

      // Dashboard redirect to OIDC is expected when not authenticated
      expect([302, 303]).toContain(res.status);
      expect(res.header.location).toEqual(expect.any(String));
      // Location must be absolute URL (https://...) or relative path (/login)
      expect(res.header.location).toMatch(/^(https?:\/\/|\/)/);
      expect(res.header.location.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    test('Responses include Helmet security headers', async () => {
      const res = await request(app).get('/info');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      // x-frame-options should be set to specific value (DENY or SAMEORIGIN)
      expect(res.headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/i);
    });

    test('Protected routes require authentication or redirect', async () => {
      const res = await request(app).post(PrivateRoutes.enterAccessCode).send({});

      // Should redirect to login (302/303) or return 401, never 500
      expect([302, 303, 400, 401]).toContain(res.status);
    });
  });

  describe('Session & Cookie Management', () => {
    test('Login endpoint returns session cookie in Set-Cookie header', async () => {
      const res = await request(app).get(PublicRoutes.login);

      expect([200, 302, 303]).toContain(res.status);
      // Session cookie must always be set
      expect(res.headers['set-cookie']).toBeDefined();
      expect(Array.isArray(res.headers['set-cookie'])).toBe(true);
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
