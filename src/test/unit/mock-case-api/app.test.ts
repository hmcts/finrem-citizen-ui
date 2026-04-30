import request from 'supertest';

import { createMockCaseApiApp } from '../../../main/mock-case-api/app';

describe('mock case api app', () => {
  const app = createMockCaseApiApp();
  const caseId = '1616591401473378';
  const caseType = 'FinancialRemedyContested';

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

  test('updates case data via events route', async () => {
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
                createdAt: '2026-01-01T00:00:00.000Z',
                validUntil: '2026-12-31T00:00:00.000Z',
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
          state: 'AccessCodeUsed',
        },
      ],
    });
  });
});
