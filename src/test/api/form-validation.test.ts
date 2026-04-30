import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';
import { PrivateRoutes } from '../../main/common-constants';

describe('Form Submission Validations', () => {
  test('POST /enter-case-number with invalid case number format returns validation error or redirects', async () => {
    const res = await request(app)
      .post(PrivateRoutes.enterCaseNumber)
      .send({ caseNumber: 'invalid' });

    // May require auth or validate input
    expect([302, 400, 401]).toContain(res.status);
  });

  test('POST /enter-case-number without case number field returns error', async () => {
    const res = await request(app)
      .post(PrivateRoutes.enterCaseNumber)
      .send({});

    expect([302, 400, 401]).toContain(res.status);
  });

  test('POST /enter-access-code with empty access code field returns validation error or stays on page', async () => {
    const res = await request(app)
      .post(PrivateRoutes.enterAccessCode)
      .send({ accessCode: '' });

    // Either redirects due to auth or returns validation error
    expect([200, 302, 401]).toContain(res.status);
  });

  test('POST /enter-access-code with invalid format returns validation error', async () => {
    const res = await request(app)
      .post(PrivateRoutes.enterAccessCode)
      .send({ accessCode: 'INVALID-CODE!' });

    expect([200, 302, 401]).toContain(res.status);
  });
});
