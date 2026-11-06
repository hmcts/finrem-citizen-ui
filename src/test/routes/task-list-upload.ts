import request from 'supertest';

import { app } from '../../main/app';
import { RouteNames } from '../../main/constants';

describe('GET /task-list-upload-dashboard', function () {
  it('should redirect to timed-out page when not authenticated', async () => {
    const response = await request(app).get(RouteNames.taskListUpload);

    expect(response.status).toBe(303);
    expect(response.header.location).toBe(RouteNames.timedOut);
  });
});
