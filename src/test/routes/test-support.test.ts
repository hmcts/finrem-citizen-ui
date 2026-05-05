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

  test('should return 400 when caseNumber is not a string', async () => {
    const res = await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: ['1234567890123456', '9999999999999999'],
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required query params');
  });

  test('should return 400 when applicantCode is missing', async () => {
    const res = await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: '1234567890123456',
        respondentCode: 'RSPCODE1',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required query params');
  });

  test('should return 400 when respondentCode is missing', async () => {
    const res = await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: '1234567890123456',
        applicantCode: 'APPCODE1',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required query params');
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

  test('should store lowercase codes as uppercase in session', async () => {
    const res = await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: '9876543210987654',
        applicantCode: 'lowercase1',
        respondentCode: 'lowercase2',
      });

    expect(res.status).toBe(302);
  });

  test('GET /__test/mock-ccd/cases/:caseId should return mock case data', async () => {
    await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: '1111111111111111',
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    const res = await request(app).get('/__test/mock-ccd/cases/1111111111111111');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1111111111111111');
    expect(res.body.state).toBe('CaseAdded');
    expect(res.body.data.applicantAccessCodes).toBeDefined();
    expect(res.body.data.respondentAccessCodes).toBeDefined();
  });

  test('GET /__test/mock-ccd/cases/:caseId should return 404 for non-existent case', async () => {
    const res = await request(app).get('/__test/mock-ccd/cases/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.exception).toBe('uk.gov.hmcts.ccd.endpoint.exceptions.ResourceNotFoundException');
    expect(res.body.message).toContain('No case found');
  });

  test('GET /__test/mock-ccd/cases/:caseId/event-triggers/:eventName should return mock token', async () => {
    const res = await request(app).get('/__test/mock-ccd/cases/2222333344445555/event-triggers/SomeEvent');

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.token).toContain('mock-token');
  });

  test('POST /__test/mock-ccd/case-users should return 201', async () => {
    const res = await request(app)
      .post('/__test/mock-ccd/case-users')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.case_users).toEqual([]);
  });

  test('POST /__test/mock-ccd/cases/:caseId/events should update case data', async () => {
    const caseId = '3333333333333333';
    
    // First inject the case
    await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: caseId,
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    // Post an event with data update
    const res = await request(app)
      .post(`/__test/mock-ccd/cases/${caseId}/events`)
      .send({
        event: { id: 'SomeEvent' },
        data: { customField: 'value' },
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(caseId);
    expect(res.body.data.customField).toBe('value');
  });

  test('POST /__test/mock-ccd/cases/:caseId/events should set state to AccessCodeUsed for invalidate applicant event', async () => {
    const caseId = '4444444444444444';
    
    await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: caseId,
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    const res = await request(app)
      .post(`/__test/mock-ccd/cases/${caseId}/events`)
      .send({
        event: { id: 'CUI_invalidateApplicantAccessCode' },
      });

    expect(res.status).toBe(200);
    expect(res.body.state).toBe('AccessCodeUsed');
  });

  test('POST /__test/mock-ccd/cases/:caseId/events should set state to AccessCodeUsed for invalidate respondent event', async () => {
    const caseId = '5555555555555555';
    
    await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: caseId,
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    const res = await request(app)
      .post(`/__test/mock-ccd/cases/${caseId}/events`)
      .send({
        event: { id: 'CUI_invalidateRespondentAccessCode' },
      });

    expect(res.status).toBe(200);
    expect(res.body.state).toBe('AccessCodeUsed');
  });

  test('GET /__test/clear-mock-ccd-store should reset the store', async () => {
    const caseId = '6666666666666666';

    await request(app)
      .get(TestRoutes.injectCaseSession)
      .query({
        caseNumber: caseId,
        applicantCode: 'APPCODE1',
        respondentCode: 'RSPCODE1',
      });

    let checkRes = await request(app).get(`/__test/mock-ccd/cases/${caseId}`);
    expect(checkRes.status).toBe(200);

    await request(app).get('/__test/clear-mock-ccd-store');

    checkRes = await request(app).get(`/__test/mock-ccd/cases/${caseId}`);
    expect(checkRes.status).toBe(404);
  });
});