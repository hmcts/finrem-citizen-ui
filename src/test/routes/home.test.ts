import { describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';

jest.mock('../../main/modules/appinsights');

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on GET', () => {
    test('should redirect to login when not authenticated', async () => {
      const res = await request(app).get('/').expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/login');
    });
  });
});
