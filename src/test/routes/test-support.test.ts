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

  test('should provide mock CCD event trigger token', async () => {
    const res = await request(app)
      .get(`${TestRoutes.mockCcdBase}/cases/1234567890123456/event-triggers/fr_event`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'mock-event-token' });
  });

  test('should accept mock CCD case-users assignment', async () => {
    const res = await request(app)
      .post(`${TestRoutes.mockCcdBase}/case-users`)
      .send({
        case_users: [
          {
            case_id: '1234567890123456',
            user_id: 'user-1',
            case_role: '[APPLICANT]'
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ case_users: [] });
  });

  test('should store and return updated case data from mock CCD events endpoint', async () => {
    await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: '1234567890123456',
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    const res = await request(app)
      .post(`${TestRoutes.mockCcdBase}/cases/1234567890123456/events`)
      .send({
        event: { id: 'invalidateApplicantAccessCode' },
        data: {
          applicantAccessCodes: [
            {
              id: 'mock-applicant-access-code',
              value: {
                accessCode: 'APPCODE1',
                isValid: 'No',
                createdAt: '2026-01-01',
                validUntil: '2027-01-01'
              }
            }
          ]
        },
        event_token: 'mock-event-token',
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1234567890123456');
    expect(res.body.data.applicantAccessCodes[0].value.isValid).toBe('No');
  });
});