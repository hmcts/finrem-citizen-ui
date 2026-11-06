import { describe, expect, jest, test } from '@jest/globals';
import request, { Response } from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, RouteNames } from '../../../main/constants';

jest.setTimeout(15000);

const assertRedirectContract = (res: Response): void => {
  expect(res.status).toBe(303);
  expect(res.header.location).toBe(RouteNames.timedOut);
  expect(res.headers['content-type']).toMatch(/text\/html|text\/plain/i);
  expect(res.text).toMatch(/Redirecting to/i);
};

describe('Access Code & Case Number Entry Workflows', () => {
  describe('Case Number Submission Flow', () => {
    test('POST /enter-case-number with a 16-digit number redirects to timed-out page without session', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      assertRedirectContract(res);
    });

    test('POST /enter-case-number with a hyphenated number redirects to timed-out page without session', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234-5678-9012-3456' });

      assertRedirectContract(res);
    });

    test('POST /enter-case-number with invalid format redirects before validation without session', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: 'invalid' });

      assertRedirectContract(res);
    });

    test('POST /enter-case-number without the field redirects to timed-out page without session', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({});

      assertRedirectContract(res);
    });

    test('POST /enter-case-number without session redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      assertRedirectContract(res);
    });
  });

  describe('Access Code Submission Without Session', () => {
    test('POST /enter-access-code with valid formats redirects to timed-out page', async () => {
      const validCodes = [
        'APPCODE1',
        'RSPCODE1',
        'TEST0001',
        'ABC12345',
        'XYZ99999',
      ];

      for (const code of validCodes) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: code });

        assertRedirectContract(res);
      }
    });

    test('POST /enter-access-code with invalid formats redirects before validation', async () => {
      const invalidCodes = [
        '',          // empty
        'SHORT',     // too short
        'WAYTOOLONG1', // too long
        'ABC-12345', // special char
        'ABC 12345', // space
        '!@#$%^&*',  // symbols
      ];

      for (const code of invalidCodes) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: code });

        assertRedirectContract(res);
      }
    });

    test('POST /enter-access-code with an empty field redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with special characters redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'INVALID-CODE!' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with a null value redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: null });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with a numeric-only value redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '12345678' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with an alphabetic-only value redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'ALPHABETA' });

      assertRedirectContract(res);
    });
  });

  describe('Access Code Letter Case Without Session', () => {
    test('POST /enter-access-code with uppercase letters redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with lowercase letters redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'testcode' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with mixed case redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TeSt0001' });

      assertRedirectContract(res);
    });
  });

  describe('Access Code Whitespace Without Session', () => {
    test('POST /enter-access-code with leading whitespace redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '   TESTCODE' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with trailing whitespace redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE   ' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with surrounding whitespace redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '   TESTCODE   ' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code with internal spaces redirects to timed-out page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TEST CODE1' });

      assertRedirectContract(res);
    });
  });

  describe('Session State in Case Lookup', () => {
    test('POST /enter-case-number without session redirects before case lookup', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      assertRedirectContract(res);
    });

    test('POST /enter-access-code without session redirects before checking the case number', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE' });

      assertRedirectContract(res);
    });
  });

  describe('Redirect Consistency Without Session', () => {
    test('Invalid access code formats consistently redirect to timed-out page', async () => {
      const invalidFormats = ['ABC', '123456789', 'INVALID!'];

      for (const format of invalidFormats) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: format });

        assertRedirectContract(res);
      }
    });

    test('Valid access code formats consistently redirect to timed-out page', async () => {
      const validFormats = ['TESTCODE', 'TEST0001', 'ABC12345'];

      for (const format of validFormats) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: format });

        assertRedirectContract(res);
      }
    });
  });
});
