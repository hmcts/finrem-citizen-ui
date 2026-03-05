import { describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { app } from '../../main/app';

describe('GET /task-list-upload-dashboard', () => {
  it('should respond with html and status 200', async () => {
    const response = await request(app).get('/task-list-upload-dashboard').expect('Content-Type', /html/);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Documents to submit before your hearing on ');
    expect(response.text).toContain('Contact us for help');
  });
});
