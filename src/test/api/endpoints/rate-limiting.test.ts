import { afterEach, describe, expect, jest, test } from '@jest/globals';
import type { Application } from 'express';
import request from 'supertest';

import { PrivateRoutes } from '../../../main/common-constants';
import { HttpStatusCodes } from '../../../main/constants/http-status-codes';

const originalRateLimitWindowMs = process.env.RATE_LIMIT_WINDOW_MS;
const originalRateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS;

async function loadAppWithRateLimit(
  windowMs: number,
  maxRequests: number
): Promise<Application> {
  process.env.RATE_LIMIT_MAX_REQUESTS = String(maxRequests);
  process.env.RATE_LIMIT_WINDOW_MS = String(windowMs);

  jest.resetModules();

  const appModule = await import('../../../main/app');
  return appModule.app;
}

afterEach(() => {
  if (originalRateLimitWindowMs === undefined) {
    delete process.env.RATE_LIMIT_WINDOW_MS;
  } else {
    process.env.RATE_LIMIT_WINDOW_MS = originalRateLimitWindowMs;
  }

  if (originalRateLimitMaxRequests === undefined) {
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
  } else {
    process.env.RATE_LIMIT_MAX_REQUESTS = originalRateLimitMaxRequests;
  }

  jest.resetModules();
});

describe('Rate limiting', () => {
  test.each([PrivateRoutes.enterAccessCode, PrivateRoutes.enterCaseNumber])(
    'throttles repeated POST requests on protected route %s',
    async (privatePath: string) => {
      const app = await loadAppWithRateLimit(60000, 2);

      const firstResponse = await request(app).post(privatePath).send({});
      const secondResponse = await request(app).post(privatePath).send({});
      const throttledResponse = await request(app).post(privatePath).send({});

      expect(firstResponse.status).not.toBe(HttpStatusCodes.TOO_MANY_REQUESTS);
      expect(secondResponse.status).not.toBe(HttpStatusCodes.TOO_MANY_REQUESTS);
      expect(throttledResponse.status).toBe(HttpStatusCodes.TOO_MANY_REQUESTS);
    }
  );
});
