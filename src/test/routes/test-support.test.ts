import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { TestRoutes } from '../../main/constants';
import setupTestSupportRoutes from '../../main/routes/generalUpload/test-support';

const buildTestSupportApp = (saveError?: Error) => {
  const testApp = express();
  const sessionState: Record<string, unknown> & { save: (cb: (err?: Error) => void) => void } = {
    save: cb => cb(saveError),
  };

  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).session = sessionState;
    next();
  });

  setupTestSupportRoutes(testApp);

  return { testApp, sessionState };
};

describe('Test support routes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_TEST_SUPPORT_ROUTES = 'true';
    process.env.TEST_SUPPORT_ROUTE_SECRET = 'local-functional-secret';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should not register route when disabled by default', async () => {
    delete process.env.ENABLE_TEST_SUPPORT_ROUTES;
    const { testApp } = buildTestSupportApp();

    const res = await request(testApp).get(TestRoutes.injectCaseSession);

    expect(res.status).toBe(404);
  });

  test('should throw startup guard when enabled outside allowed envs', () => {
    process.env.NODE_ENV = 'production';

    expect(() => buildTestSupportApp()).toThrow(
      'ENABLE_TEST_SUPPORT_ROUTES=true is not allowed in "production". Allowed environments: local, development, test, preview, aat.'
    );
  });

  test('should throw startup guard when secret is missing', () => {
    delete process.env.TEST_SUPPORT_ROUTE_SECRET;

    expect(() => buildTestSupportApp()).toThrow(
      'ENABLE_TEST_SUPPORT_ROUTES=true requires TEST_SUPPORT_ROUTE_SECRET to be set.'
    );
  });

  test('should return 403 when secret header is missing', async () => {
    const { testApp } = buildTestSupportApp();

    const res = await request(testApp)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: '1234567890123456',
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden' });
  });

  test('should return 400 when inject-case-session params are missing', async () => {
    const { testApp } = buildTestSupportApp();

    const res = await request(testApp)
      .get(TestRoutes.injectCaseSession)
      .set('x-test-support-secret', 'local-functional-secret');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Missing required query params: caseNumber, applicantCode, respondentCode',
    });
  });

  test('should redirect to enter-access-code when params are valid', async () => {
    const { testApp } = buildTestSupportApp();

    const res = await request(testApp)
      .get(TestRoutes.injectCaseSession)
      .set('x-test-support-secret', 'local-functional-secret')
      .query({
        caseNumber: '1234567890123456',
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-access-code');
  });

  test('should persist case number and uppercase access codes in session before redirecting', async () => {
    const { testApp, sessionState } = buildTestSupportApp();

    const res = await request(testApp)
      .get(TestRoutes.injectCaseSession)
      .set('x-test-support-secret', 'local-functional-secret')
      .query({
        caseNumber: '1234567890123456',
        applicantCode: 'appcode1',
        respondentCode: 'rspcode1',
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-access-code');
    expect(sessionState.caseNumber).toBe('1234567890123456');
    expect(sessionState.caseData).toEqual(
      expect.objectContaining({
        applicantAccessCodes: [
          expect.objectContaining({
            value: expect.objectContaining({
              accessCode: 'APPCODE1',
              isValid: 'Yes',
            }),
          }),
        ],
        respondentAccessCodes: [
          expect.objectContaining({
            value: expect.objectContaining({
              accessCode: 'RSPCODE1',
              isValid: 'Yes',
            }),
          }),
        ],
      })
    );
  });

  test('should return 500 when session save fails', async () => {
    const { testApp } = buildTestSupportApp(new Error('save failed'));

    const res = await request(testApp)
      .get(TestRoutes.injectCaseSession)
      .set('x-test-support-secret', 'local-functional-secret')
      .query({
        caseNumber: '1234567890123456',
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Session save error' });
  });
});
