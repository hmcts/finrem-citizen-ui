import { expect } from 'chai';
import request from 'supertest';

import { app } from '../../main/app';

describe('Home page', () => {
  describe('on GET', () => {
    test('should redirect to IDAM login when not authenticated', async () => {
      await request(app)
        .get('/')
        .expect(res => {
          // Expect a Redirect (302) instead of Success (200)
          expect(res.status).to.equal(302);
          // Verify it is sending us to a login page
          expect(res.header['location']).to.include('/login');
        });
    });
  });
});
