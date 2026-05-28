import express, { Express } from 'express';
import request from 'supertest';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue('working-test'),
  }));
});

import redisTestRoute from '../../../main/routes/redis-test';

describe('redis-test route', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    redisTestRoute(app);
  });

  test('should verify redis connectivity', async () => {
    const response = await request(app).get('/redis-test');

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      ping: 'PONG',
      redisWriteReadSuccess: false,
      value: 'working-test',
    });
  });
});
