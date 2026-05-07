import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, PublicRoutes } from '../../../main/common-constants';

describe('Error Handling & Status Codes', () => {
  describe('404 & Method Not Allowed', () => {
    test('GET /nonexistent returns 404', async () => {
      const res = await request(app).get('/nonexistent-route-xyz');

      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/text\/html|application\/json/i);
      if (/application\/json/i.test(res.headers['content-type'])) {
        expect(res.body).toEqual(expect.any(Object));
      } else {
        expect(res.text).toMatch(/Cannot GET|Not Found|Error/i);
      }
    });

    test('POST / (root) returns 404 (no handler for POST root)', async () => {
      const res = await request(app).post(PublicRoutes.basePath);

      // Root POST is not defined in the routing, should return 404
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/text\/html|application\/json/i);
      if (/application\/json/i.test(res.headers['content-type'])) {
        expect(res.body).toEqual(expect.any(Object));
      } else {
        expect(res.text).toMatch(/Cannot POST|Not Found|Error/i);
      }
    });
  });

  describe('Error Responses', () => {
    test('GET /info returns 200 (successful response, not server error)', async () => {
      const res = await request(app).get('/info');

      // /info is a public endpoint that should always succeed
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

    test('Malformed JSON to protected routes returns 400 (parser error before auth check)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // JSON parsing fails before auth middleware runs, so returns 400
      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/text\/html|application\/json/i);
      if (/application\/json/i.test(res.headers['content-type'])) {
        expect(res.body).toEqual(expect.any(Object));
      } else {
        expect(res.text).toMatch(/JSON|SyntaxError|invalid|Expected/i);
      }
    });
  });
});
