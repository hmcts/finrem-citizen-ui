process.env.ENABLE_TEST_SUPPORT_ROUTES = 'true';

import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';
import { TestRoutes } from '../../main/common-constants';

describe('Test support routes', () => {
  test('should return 400 when inject-case-session params are missing', async () => {
    const res = await request(app).get(TestRoutes.injectCaseSession);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Missing required query params: caseNumber, applicantCode, respondentCode',
    });
  });

  test('should redirect to enter-access-code when params are valid', async () => {
    const res = await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: '1234567890123456',
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-access-code');
  });

  describe('Mock CCD API endpoints', () => {
    const caseId = '1234567890123456';
    const eventName = 'invalidateAccessCodeEvent';

    test('should return mock event token from GET /cases/:caseId/event-triggers/:eventName', async () => {
      const res = await request(app).get(`/__test/mock-ccd/cases/${caseId}/event-triggers/${eventName}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        token: `mock-token-for-${caseId}`,
        case_id: caseId,
      });
    });

    test('should accept event submission and return updated case data from POST /cases/:caseId/events', async () => {
      const eventData = {
        applicantAccessCodes: [
          {
            id: 'code-1',
            value: {
              accessCode: 'APPCODE1',
              isValid: 'No',
            },
          },
        ],
      };

      const res = await request(app)
        .post(`/__test/mock-ccd/cases/${caseId}/events`)
        .send({
          data: eventData,
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: caseId,
          created_date: expect.any(String),
          data: expect.objectContaining({
            applicantAccessCodes: eventData.applicantAccessCodes,
          }),
        })
      );
    });

    test('should clear mock CCD store from GET /__test/clear-mock-ccd-store', async () => {
      const res = await request(app).get('/__test/clear-mock-ccd-store');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Mock CCD store cleared' });
    });
  });
});