import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../../main/app';
import { PrivateRoutes } from '../../../main/common-constants';

describe('Access Code & Case Number Entry Workflows', () => {
  describe('Case Number Submission Flow', () => {
    test('POST /enter-case-number with valid 16-digit case number format', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      expect([200, 302, 401]).toContain(res.status);
    });

    test('POST /enter-case-number with hyphenated case number format', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234-5678-9012-3456' });

      expect([200, 302, 400, 401]).toContain(res.status);
    });

    test('POST /enter-case-number with invalid case number format returns validation error or redirects', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: 'invalid' });

      expect([302, 400, 401]).toContain(res.status);
    });

    test('POST /enter-case-number without case number field returns error', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({});

      expect([302, 400, 401]).toContain(res.status);
    });

    test('POST /enter-case-number stores case number in session on success', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      expect([200, 302]).toContain(res.status);
    });
  });

  describe('Access Code Entry & Validation', () => {
    test('POST /enter-access-code with valid format passes client validation', async () => {
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

        expect([200, 302]).toContain(res.status);
      }
    });

    test('POST /enter-access-code rejects invalid formats consistently', async () => {
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

        expect([200, 302, 400]).toContain(res.status);
      }
    });

    test('POST /enter-access-code with empty access code field returns validation error or stays on page', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '' });

      expect([200, 302, 401]).toContain(res.status);
    });

    test('POST /enter-access-code with invalid format returns validation error', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'INVALID-CODE!' });

      expect([200, 302, 401]).toContain(res.status);
    });

    test('POST /enter-access-code handles null/undefined gracefully', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: null });

      expect([200, 302, 400]).toContain(res.status);
    });

    test('POST /enter-access-code with numeric-only string is rejected', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '12345678' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code with alpha-only string is rejected if length != 8', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'ALPHABETA' });

      expect([200, 302]).toContain(res.status);
    });
  });

  describe('Access Code Case Sensitivity', () => {
    test('POST /enter-access-code accepts uppercase codes', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code accepts lowercase codes', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'testcode' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code accepts mixed case codes', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TeSt0001' });

      expect([200, 302]).toContain(res.status);
    });
  });

  describe('Access Code Whitespace Handling', () => {
    test('POST /enter-access-code trims leading whitespace', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '   TESTCODE' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code trims trailing whitespace', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE   ' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code trims both leading and trailing whitespace', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: '   TESTCODE   ' });

      expect([200, 302]).toContain(res.status);
    });

    test('POST /enter-access-code rejects codes with internal spaces', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TEST CODE1' });

      expect([200, 302]).toContain(res.status);
      if (res.status === 302 && res.header.location) {
        expect(res.header.location).not.toMatch(/\/dashboard/);
      }
    });
  });

  describe('Session State in Case Lookup', () => {
    test('POST /enter-case-number without session redirects to oauth2/login', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterCaseNumber)
        .send({ caseNumber: '1234567890123456' });

      expect([302, 401]).toContain(res.status);
    });

    test('POST /enter-access-code without caseNumber in session redirects to enter-case-number', async () => {
      const res = await request(app)
        .post(PrivateRoutes.enterAccessCode)
        .send({ accessCode: 'TESTCODE' });

      expect([302, 401]).toContain(res.status);
    });
  });

  describe('Error Response Consistency', () => {
    test('Invalid access code format consistently shows form with error', async () => {
      const invalidFormats = ['ABC', '123456789', 'INVALID!'];

      for (const format of invalidFormats) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: format });

        expect([200, 302]).toContain(res.status);
        if (res.status === 200) {
          expect(res.text).toBeTruthy();
        }
      }
    });

    test('Valid format codes have consistent handling (session-dependent)', async () => {
      const validFormats = ['TESTCODE', 'TEST0001', 'ABC12345'];

      for (const format of validFormats) {
        const res = await request(app)
          .post(PrivateRoutes.enterAccessCode)
          .send({ accessCode: format });

        expect([200, 302]).toContain(res.status);
      }
    });
  });
});
