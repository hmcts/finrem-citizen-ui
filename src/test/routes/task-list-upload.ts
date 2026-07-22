import request from 'supertest';

import { app } from '../../main/app';
import { RouteNames } from '../../main/common-constants';

describe('GET /task-list-upload-dashboard', function () {
  it('should redirect to login when not authenticated', async function () {
    const response = await request(app).get(RouteNames.taskListUpload);

    expect(response.status).toBe(302);
    expect(response.header.location).toBe(RouteNames.login);
  });
});
