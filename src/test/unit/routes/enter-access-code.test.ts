import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { triggerSystemEvent } from '../../../main/app/case/case-api';
import { EVENT_TYPE } from '../../../main/app/case/case-type';
import {
  FinremCaseData,
  YesOrNo,
} from '../../../main/app/case/definition';
import setupEnterAccessCodeRoute from '../../../main/routes/generalUpload/enter-access-code';

jest.mock('../../../main/middleware', () => ({
  oidcMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../../../main/app/case/case-api', () => ({
  triggerSystemEvent: jest.fn(),
}));

const buildMockCaseData = (
  applicantCode = 'APPCODE1',
  respondentCode = 'RSPCODE1',
  isValid: YesOrNo = YesOrNo.YES
): FinremCaseData =>
  ({
    applicantAccessCodes: [
      { id: '1', value: { accessCode: applicantCode, isValid } },
    ],
    respondentAccessCodes: [
      { id: '2', value: { accessCode: respondentCode, isValid } },
    ],
    applicantFlags: {
      partyName: 'Test Applicant Name',
    },
    respondentFlags: {
      partyName: 'Test Respondent Name',
    },
  } as unknown as FinremCaseData);

const buildTestApp = (sessionOverrides: Record<string, unknown> = {}) => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: false }));

  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    Object.assign(req, {
      session: {
        user: {
          id: 'user-1',
          email: 'user-1@example.com',
        },
        save: (cb?: (err?: Error) => void) => {
          cb?.();
        },
        ...sessionOverrides,
      },
    });
    next();
  });

  testApp.use((_req: Request, res: Response, next: NextFunction) => {
    Object.assign(res, {
      render: (view: string, locals?: unknown) => res.status(200).json({ view, locals }),
    });
    next();
  });

  setupEnterAccessCodeRoute(testApp);
  return testApp;
};

describe('GET /enter-access-code route handler', () => {
  it('redirects to enter-case-number when no caseNumber in session', async () => {
    const res = await request(buildTestApp()).get('/enter-access-code');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
  });

  it('renders enter-access-code view when caseNumber is in session', async () => {
    const res = await request(buildTestApp({ caseNumber: '1234567890123456' })).get('/enter-access-code');
    expect(res.status).toBe(200);
    expect(res.body.view).toBe('enter-access-code');
  });
});

describe('POST /enter-access-code route handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(triggerSystemEvent).mockResolvedValue(buildMockCaseData());
  });

  it('redirects to enter-case-number when no caseNumber in session', async () => {
    const res = await request(buildTestApp()).post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
  });

  it('renders with validation errors for empty access code', async () => {
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData: buildMockCaseData() }))
      .post('/enter-access-code').send({ accessCode: '' });
    expect(res.status).toBe(200);
    expect(res.body.locals.errors.accessCode).toBe('Enter your access code');
    expect(triggerSystemEvent).not.toHaveBeenCalled();
  });

  it('renders with validation errors for wrong-length access code', async () => {
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData: buildMockCaseData() }))
      .post('/enter-access-code').send({ accessCode: 'SHORT' });
    expect(res.status).toBe(200);
    expect(res.body.locals.errors.accessCode).toBe('Access code must be 8 characters');
    expect(triggerSystemEvent).not.toHaveBeenCalled();
  });

  it('redirects to enter-case-number when caseData missing from session', async () => {
    const res = await request(buildTestApp({ caseNumber: '1234567890123456' }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
  });

  it('renders error when access code does not match case data', async () => {
    const caseData = buildMockCaseData();
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'NOMATCH1' });
    expect(res.status).toBe(200);
    expect(res.body.locals.errors.accessCode).toBe('Access code does not match case number');
    expect(triggerSystemEvent).not.toHaveBeenCalled();
  });

  it('renders error when access code has already been used', async () => {
    const caseData = buildMockCaseData('APPCODE1', 'RSPCODE1', YesOrNo.NO);
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(200);
    expect(res.body.view).toBe('enter-access-code');
    expect(res.body.locals.errors.accessCode).toBe(
      'The access code you entered has already been used, you should contact the court.'
    );
    expect(res.body.locals.accessCode).toBe('APPCODE1');
    expect(triggerSystemEvent).not.toHaveBeenCalled();
  });

  it('calls triggerSystemEvent with hyphen-stripped case id', async () => {
    const caseData = buildMockCaseData();
    const res = await request(buildTestApp({ caseNumber: '1234-5678-9012-3456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });

    expect(res.status).toBe(302);
    expect(triggerSystemEvent).toHaveBeenCalledWith(
      '1234567890123456',
      expect.any(Object),
      EVENT_TYPE.LINK_APPLICANT_TO_CASE,
      expect.any(Object)
    );
  });

  it('passes UTC usedAt timestamp to triggerSystemEvent payload', async () => {
    const caseData = buildMockCaseData();
    await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });

    const payload = jest.mocked(triggerSystemEvent).mock.calls[0][1] as {
      applicantAccessCodes: { value: { usedAt: string } }[];
    };
    const usedAt = payload.applicantAccessCodes[0].value.usedAt;

    expect(usedAt).toMatch(/Z$/);
  });

  it('redirects to dashboard on successful applicant access code submission', async () => {
    const caseData = buildMockCaseData();
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/dashboard');
    expect(triggerSystemEvent).toHaveBeenCalledWith(
      '1234567890123456',
      expect.objectContaining({
        applicantEmail: 'user-1@example.com',
        applicantAccessCodes: [
          expect.objectContaining({
            id: '1',
            value: expect.objectContaining({
              isValid: YesOrNo.NO,
              userIdamID: 'user-1',
            }),
          }),
        ],
      }),
      EVENT_TYPE.LINK_APPLICANT_TO_CASE,
      expect.any(Object)
    );
  });

  it('redirects to dashboard on successful respondent access code submission', async () => {
    const caseData = buildMockCaseData();
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'RSPCODE1' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/dashboard');
    expect(triggerSystemEvent).toHaveBeenCalledWith(
      '1234567890123456',
      expect.objectContaining({
        respondentEmail: 'user-1@example.com',
        respondentAccessCodes: [
          expect.objectContaining({
            id: '2',
            value: expect.objectContaining({
              isValid: YesOrNo.NO,
              userIdamID: 'user-1',
            }),
          }),
        ],
      }),
      EVENT_TYPE.LINK_RESPONDENT_TO_CASE,
      expect.any(Object)
    );
  });

  it('renders error view when triggerSystemEvent throws', async () => {
    jest.mocked(triggerSystemEvent).mockRejectedValue(new Error('CCD down'));
    const caseData = buildMockCaseData();
    const res = await request(buildTestApp({ caseNumber: '1234567890123456', caseData }))
      .post('/enter-access-code').send({ accessCode: 'APPCODE1' });
    expect(res.status).toBe(200);
    expect(res.body.view).toBe('error');
  });
});
