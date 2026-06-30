import { beforeAll, describe, expect, test } from '@jest/globals';
import { Express } from 'express';
import request from 'supertest';

import { createMockCaseApiApp, MockCaseApiOptions } from '../../../main/mock-case-api/app';

describe('[MOCK] Case API endpoints', () => {
  let app: Express;

  const seededCaseId = '1616591401473378';
  const seededCaseTypeId = 'FinancialRemedyContested';

  beforeAll(async () => {

    const seededCase: NonNullable<MockCaseApiOptions['seedCases']>[number] = {
      id: seededCaseId,
      state: 'CaseAdded',
      caseTypeId: seededCaseTypeId,
      data: {
        divorceCaseNumber: 'LV24D00001',
        applicantAccessCodes: [
          {
            id: 'mock-applicant-access-code',
            value: {
              accessCode: 'APPCODE1',
              isValid: 'Yes',
            },
          },
        ],
        respondentAccessCodes: [
          {
            id: 'mock-respondent-access-code',
            value: {
              accessCode: 'RSPCODE1',
              isValid: 'Yes',
            },
          },
        ],
        currentUserCaseRole: '[APPLICANT]',
      },
    };

    app = createMockCaseApiApp({
      seedCases: [seededCase],
    });
  });

  test('GET /health returns UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'UP' });
  });

  test('GET /cases/:caseId returns seeded case', async () => {
    const res = await request(app).get(`/cases/${seededCaseId}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: seededCaseId,
      state: 'CaseAdded',
      data: {
        applicantAccessCodes: [{ value: { accessCode: 'APPCODE1' } }],
        respondentAccessCodes: [{ value: { accessCode: 'RSPCODE1' } }],
      },
    });
  });

  test('GET /cases/:caseId returns 404 for unknown case', async () => {
    const res = await request(app).get('/cases/unknown-case-id');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Case unknown-case-id not found' });
  });

  test('GET /cases/:caseId/event-triggers/:eventId returns a token', async () => {
    const eventId = 'CUI_invalidateApplicantAccessCode';
    const res = await request(app).get(`/cases/${seededCaseId}/event-triggers/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: `mock-token-${seededCaseId}-${eventId}` });
  });

  test('POST /cases/:caseId/events merges data and updates state for invalidate access code events', async () => {

    const res = await request(app)
      .post(`/cases/${seededCaseId}/events`)
      .send({
        event: { id: 'CUI_invalidateApplicantAccessCode' },
        event_token: 'mock-token',
        data: {
          applicantAccessCodes: [
            {
              id: 'mock-applicant-access-code',
              value: {
                accessCode: 'APPCODE1',
                isValid: 'No',
              },
            },
          ],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: seededCaseId,
      state: 'AccessCodeUsed',
      data: {
        applicantAccessCodes: [{ value: { isValid: 'No' } }],
      },
    });
  });

  test('POST /case-users accepts assignments (204)', async () => {
    const res = await request(app)
      .post('/case-users')
      .send({
        case_users: [
          {
            case_id: seededCaseId,
            user_id: 'user-1',
            case_role: '[APPLICANT]',
          },
        ],
      });

    expect(res.status).toBe(204);
  });

  test('POST /searchCases returns all cases when ctid omitted', async () => {
    const res = await request(app).post('/searchCases').send({ query: { match_all: {} } });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.cases[0]).toMatchObject({ id: seededCaseId });
  });

  test('POST /searchCases filters by ctid', async () => {
    const res = await request(app)
      .post(`/searchCases?ctid=${seededCaseTypeId}`)
      .send({ query: { match_all: {} } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total: 1,
      cases: [{ id: seededCaseId }],
    });
  });
});
