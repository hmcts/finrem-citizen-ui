import { describe, expect, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';

describe('Home page', () => {
  describe('on GET', () => {
    test('should return sample home page', async () => {
      const res = await request(app).get('/').expect(200);

      expect(res.status).toBe(200);
    });
  });
});
