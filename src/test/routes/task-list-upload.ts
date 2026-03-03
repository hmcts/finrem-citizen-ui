import { expect } from 'chai';
import request from 'supertest';

import { app } from '../../main/app';

describe('GET /task-list-upload-dashboard', function () {
  it('should respond', async function () {
    const response = await request(app).get('/task-list-upload-dashboard');
    expect(response.status).to.be.oneOf([200, 302]);
  });
});
