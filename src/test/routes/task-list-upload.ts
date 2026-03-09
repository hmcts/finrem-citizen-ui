import request from 'supertest';

import { app } from '../../main/app';

describe('GET /task-list-upload-dashboard', function () {
  it('should respond', async function () {
    const response = await request(app).get('/task-list-upload-dashboard');
    // Use Jest's native syntax instead of Chai
    expect([200, 302]).toContain(response.status);
  });
});
