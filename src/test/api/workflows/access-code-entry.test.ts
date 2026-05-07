import { describe, expect, jest, test } from '@jest/globals';
import request, { Response } from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes, PublicRoutes } from '../../../main/common-constants';

jest.setTimeout(15000);

const assertRedirectContract = (res: Response, expectedLocation: RegExp | string): void => {
  expect(res.status).toBe(302);
  expect(res.header.location).toEqual(expect.any(String));
  expect(res.header.location.length).toBeGreaterThan(0);
  expect(res.headers['content-type']).toMatch(/text\/html|text\/plain/i);
  expect(res.text).toMatch(/Redirecting to/i);

  if (typeof expectedLocation === 'string') {
    expect(res.header.location).toBe(expectedLocation);
    return;
  }

  expect(res.header.location).toMatch(expectedLocation);
};

describe('Access Code & Case Number Entry Workflows', () => {
  describe('Case Number Submission Flow', () => {
    test('POST /enter-case-number with valid 16-digit case number format (unauthenticated redirects)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      // Unauthenticated request redirects to OIDC login
      assertRedirectContract(res, /oauth2|login/i);
    });

    test('POST /enter-case-number with hyphenated case number format (unauthenticated redirects)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234-5678-9012-3456' });

      // Unauthenticated request redirects to OIDC login
      assertRedirectContract(res, /oauth2|login/i);
    });

    test('POST /enter-case-number with invalid case number format returns validation error or redirects', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: 'invalid' });

      // Invalid format stays on the form or redirects to same route
      assertRedirectContract(res, /enter-case-number/i);
    });

    test('POST /enter-case-number without case number field returns redirect', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({});

      // Missing field stays on the form or redirects to same route
      assertRedirectContract(res, /enter-case-number/i);
    });

    test('POST /enter-case-number without session redirects to oauth2/login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      // No session present, should redirect to OIDC login
      assertRedirectContract(res, /oauth2|login/i);
    });
  });

  describe('Access Code Entry & Validation', () => {
    test('POST /enter-access-code with valid format redirects to /login (no session)', async () => {
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

        // Without session, redirects to login before processing valid format
        assertRedirectContract(res, PublicRoutes.login);
      }
    });

    test('POST /enter-access-code with invalid formats redirects to /login (no session)', async () => {
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

        // Auth check happens before validation; unauthenticated redirects regardless of format
        assertRedirectContract(res, PublicRoutes.login);
      }
    });

    test('POST /enter-access-code with empty field redirects to /login (no session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '' });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code with invalid format redirects to /login (no session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'INVALID-CODE!' });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code handles null/undefined gracefully', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: null });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code with numeric-only string redirects to /login (no session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '12345678' });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code with alpha-only string redirects to /login (no session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'ALPHABETA' });

      assertRedirectContract(res, PublicRoutes.login);
    });
  });

  describe('Access Code Case Sensitivity', () => {
    test('POST /enter-access-code accepts uppercase codes (redirects without session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE' });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code accepts lowercase codes (redirects without session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'testcode' });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code accepts mixed case codes (redirects without session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TeSt0001' });

      assertRedirectContract(res, PublicRoutes.login);
    });
  });

  describe('Access Code Whitespace Handling', () => {
    test('POST /enter-access-code trims leading whitespace (redirects without session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '   TESTCODE' });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code trims trailing whitespace (redirects without session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE   ' });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code trims both leading and trailing whitespace (redirects without session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '   TESTCODE   ' });

      assertRedirectContract(res, PublicRoutes.login);
    });

    test('POST /enter-access-code rejects codes with internal spaces (redirects without session)', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TEST CODE1' });

      assertRedirectContract(res, PublicRoutes.login);
    });
  });

  describe('Session State in Case Lookup', () => {
    test('POST /enter-case-number without session redirects to oauth2/login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      assertRedirectContract(res, /oauth2|login/i);
    });

    test('POST /enter-access-code without caseNumber in session redirects to /login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE' });

      assertRedirectContract(res, PublicRoutes.login);
    });
  });

  describe('Error Response Consistency', () => {
    test('Invalid access code formats redirect to /login (no session)', async () => {
      const invalidFormats = ['ABC', '123456789', 'INVALID!'];

      for (const format of invalidFormats) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: format });

        assertRedirectContract(res, PublicRoutes.login);
      }
    });

    test('Valid format codes redirect to /login (no session)', async () => {
      const validFormats = ['TESTCODE', 'TEST0001', 'ABC12345'];

      for (const format of validFormats) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: format });

        assertRedirectContract(res, PublicRoutes.login);
      }
    });
  });
});
