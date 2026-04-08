process.env.ENABLE_TEST_SUPPORT_ROUTES = 'true';

import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';

describe('Test support routes', () => {
  test('should return 400 when inject-case-session params are missing', async () => {
    const res = await request(app).get('/__test/inject-case-session');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Missing required query params: caseNumber, applicantCode, respondentCode',
    });
  });

  test('should redirect to enter-access-code when params are valid', async () => {
    const res = await request(app)
      .get('/__test/inject-case-session')
      .query({
        caseNumber: '1234567890123456',
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-access-code');
  });
});