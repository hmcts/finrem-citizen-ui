import { Express } from 'express';
import request from 'supertest';

import { createMockCaseApiApp } from '../../../main/mock-case-api/app';

describe('mock case api app', () => {
  const caseId = '1616591401473378';
  const caseType = 'FinancialRemedyContested';
  let app: Express;

  beforeEach(() => {
    app = createMockCaseApiApp();
  });

  test('returns a seeded case by id', async () => {
    const response = await request(app).get(`/cases/${caseId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: caseId,
      state: 'CaseAdded',
      data: {
        applicantAccessCodes: [
          {
            value: {
              accessCode: 'APPCODE1',
            },
          },
        ],
      },
    });
  });

  test('returns a token for event trigger route', async () => {
    const response = await request(app).get(
      `/cases/${caseId}/event-triggers/CUI_invalidateApplicantAccessCode`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: `mock-token-${caseId}-CUI_invalidateApplicantAccessCode`,
    });
  });

  test('returns 404 for an unknown case', async () => {
    const response = await request(app).get('/cases/unknown-case-id');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Case unknown-case-id not found',
    });
  });

  test('returns 404 for an event trigger on an unknown case', async () => {
    const response = await request(app).get('/cases/unknown-case-id/event-triggers/some-event');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Case unknown-case-id not found',
    });
  });

  test('updates case data via events route', async () => {
    const createdAt = new Date().toISOString();
    const validUntil = getFutureIsoDate(90);

    const response = await request(app)
      .post(`/cases/${caseId}/events`)
      .send({
        event: { id: 'CUI_invalidateApplicantAccessCode' },
        event_token: 'mock-token',
        data: {
          applicantAccessCodes: [
            {
              id: 'mock-applicant-access-code',
              value: {
                accessCode: 'APPCODE1',
                createdAt,
                validUntil,
                isValid: 'No',
              },
            },
          ],
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: caseId,
      state: 'AccessCodeUsed',
      data: {
        applicantAccessCodes: [
          {
            value: {
              isValid: 'No',
            },
          },
        ],
      },
    });
  });

  test('keeps the existing state for unknown events', async () => {
    const response = await request(app)
      .post(`/cases/${caseId}/events`)
      .send({
        event: { id: 'someOtherEvent' },
        event_token: 'mock-token',
        data: {
          hearingDetails: 'Mock hearing details',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: caseId,
      state: 'CaseAdded',
      data: {
        hearingDetails: 'Mock hearing details',
      },
    });
  });

  test('returns 404 when updating an unknown case', async () => {
    const response = await request(app)
      .post('/cases/unknown-case-id/events')
      .send({
        event: { id: 'CUI_invalidateApplicantAccessCode' },
        data: {},
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Case unknown-case-id not found',
    });
  });

  test('accepts case user assignments', async () => {
    const response = await request(app)
      .post('/case-users')
      .send({
        case_users: [
          {
            case_id: caseId,
            user_id: 'user-1',
            case_role: '[APPLICANT]',
          },
        ],
      });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  test('searches cases by case type', async () => {
    const response = await request(app)
      .post(`/searchCases?ctid=${caseType}`)
      .send(JSON.stringify({ query: { match_all: {} } }));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      total: 1,
      cases: [
        {
          id: caseId,
          state: 'CaseAdded',
        },
      ],
    });
  });

  test('returns all cases when ctid is omitted', async () => {
    const response = await request(app).post('/searchCases').send(JSON.stringify({ query: { match_all: {} } }));

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.cases[0].id).toBe(caseId);
  });

  test('returns health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP' });
  });
});

function getFutureIsoDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}
