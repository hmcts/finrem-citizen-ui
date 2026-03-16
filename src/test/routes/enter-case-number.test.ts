import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';

describe('Enter Case Number page', () => {
  describe('on GET /enter-case-number', () => {
    test('should return enter case number page', async () => {
      const res = await request(app).get('/enter-case-number');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Enter case number');
    });
  });

  describe('on POST /enter-case-number', () => {
    test('should redirect to enter-access-code with valid case number', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '1234567890123456' })
        .expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/enter-access-code');
    });

    test('should redirect back with error when case number is empty', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '' })
        .expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/enter-case-number');
    });

    test('should redirect back with error when case number is too short', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '12345' })
        .expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/enter-case-number');
    });

    test('should redirect back with error when case number is too long', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '123456789012345678901' })
        .expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/enter-case-number');
    });

    test('should redirect back with error when case number has invalid characters', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '1234-5678-ABCD-4567' })
        .expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/enter-case-number');
    });

    test('should accept valid case number with hyphens', async () => {
      const res = await request(app)
        .post('/enter-case-number')
        .send({ caseNumber: '1234-5678-0123-4567' })
        .expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/enter-access-code');
    });
  });
});
