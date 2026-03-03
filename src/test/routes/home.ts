import { expect } from 'chai';
import request from 'supertest';

import { app } from '../../main/app';

describe('Home page', () => {
  describe('on GET', () => {
    test('should respond', async () => {
      const response = await request(app).get('/');
      expect(response.status).to.be.oneOf([200, 302]);
    });
  });
});
