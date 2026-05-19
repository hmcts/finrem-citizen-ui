import { beforeAll, describe, expect, test } from '@jest/globals';
import { Express } from 'express';
import request from 'supertest';

import { createMockCaseApiApp, MockCaseApiOptions } from '../../../main/mock-case-api/app';

describe('[MOCK] Case API endpoints', () => {
  let app: Express;

  const seededCaseId = '1616591401473378';
  const seededCaseTypeId = 'FinancialRemedyContested';

  beforeAll(async () => {
    const createdAt = new Date().toISOString();
    const validUntil = getFutureIsoDate(90);

    const seededCase: NonNullable<MockCaseApiOptions['seedCases']>[number] = {
      id: seededCaseId,
      state: 'CaseAdded',
      caseTypeId: seededCaseTypeId,
      createdDate: createdAt,
      data: {
        divorceCaseNumber: 'LV24D00001',
        applicantAccessCodes: [
          {
            id: 'mock-applicant-access-code',
            value: {
              accessCode: 'APPCODE1',
              createdAt,
              validUntil,
              isValid: 'Yes',
            },
          },
        ],
        respondentAccessCodes: [
          {
            id: 'mock-respondent-access-code',
            value: {
              accessCode: 'RSPCODE1',
              createdAt,
              validUntil,
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
    const createdAt = new Date().toISOString();
    const validUntil = getFutureIsoDate(90);

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
                createdAt,
                validUntil,
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

  test('POST /cases/:caseId/events merges uploadGeneralDocuments payload for link-document event template', async () => {
    const res = await request(app)
      .post(`/cases/${seededCaseId}/events`)
      .send({
        event: {
          id: 'CUI_linkDocumentToCase',
          summary: 'Adding uploaded document',
          description: 'Document added via API',
        },
        case_reference: seededCaseId,
        event_token: 'mock-token',
        data: {
          uploadGeneralDocuments: [
            {
              id: '4c8c1f1f-0f6f-4e7f-9d4d-8a4a2e8f2c01',
              value: {
                DocumentType: 'Other',
                DocumentFileName: 'test doc 3.docx',
                DocumentLink: {
                  document_url: 'http://dm-store/documents/doc-123',
                  document_binary_url: 'http://dm-store/documents/doc-123/binary',
                },
              },
            },
          ],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: seededCaseId,
      data: {
        uploadGeneralDocuments: [
          {
            id: '4c8c1f1f-0f6f-4e7f-9d4d-8a4a2e8f2c01',
            value: {
              DocumentType: 'Other',
              DocumentFileName: 'test doc 3.docx',
              DocumentLink: {
                document_url: 'http://dm-store/documents/doc-123',
                document_binary_url: 'http://dm-store/documents/doc-123/binary',
              },
            },
          },
        ],
      },
    });
  });

  test('POST /cases/:caseId/events merges citizen applicant document collection for applicant upload event', async () => {
    const res = await request(app)
      .post(`/cases/${seededCaseId}/events`)
      .send({
        event: { id: 'CUI_applicantUploadDocuments' },
        event_token: 'mock-token',
        data: {
          citizenApplicantDocument: [
            {
              id: 'doc-1',
              value: {
                DocumentType: 'P60',
                DocumentFileName: 'applicant-doc.pdf',
                DocumentLink: {
                  document_url: 'http://dm-store/documents/a',
                  document_binary_url: 'http://dm-store/documents/a/binary',
                },
              },
            },
          ],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: seededCaseId,
      data: {
        citizenApplicantDocument: [
          {
            id: 'doc-1',
            value: {
              DocumentType: 'P60',
              DocumentFileName: 'applicant-doc.pdf',
            },
          },
        ],
      },
    });
  });

  test('POST /cases/:caseId/events merges citizen respondent document collection for respondent upload event', async () => {
    const res = await request(app)
      .post(`/cases/${seededCaseId}/events`)
      .send({
        event: { id: 'CUI_respondentUploadDocuments' },
        event_token: 'mock-token',
        data: {
          citizenRespondentDocument: [
            {
              id: 'doc-2',
              value: {
                DocumentType: 'Bank statements',
                DocumentFileName: 'respondent-doc.pdf',
                DocumentLink: {
                  document_url: 'http://dm-store/documents/r',
                  document_binary_url: 'http://dm-store/documents/r/binary',
                },
              },
            },
          ],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: seededCaseId,
      data: {
        citizenRespondentDocument: [
          {
            id: 'doc-2',
            value: {
              DocumentType: 'Bank statements',
              DocumentFileName: 'respondent-doc.pdf',
            },
          },
        ],
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

function getFutureIsoDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}
