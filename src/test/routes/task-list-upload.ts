import { app } from '../../main/app';

import { expect } from 'chai';
import request from 'supertest';

describe('GET /task-list-upload-dashboard', function () {
  it('should respond with html and status 200', async function () {
    const response = await request(app).get('/task-list-upload-dashboard').expect('Content-Type', /html/);

    expect(response.status).to.equal(200);
    expect(response.text).to.contain('Documents to submit before your hearing on ');
    expect(response.text).to.contain('Contact us for help');
  });
});
