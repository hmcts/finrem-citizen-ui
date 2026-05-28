import express, { Express } from 'express';
import request from 'supertest';

const mockPing = jest.fn();
const mockSet = jest.fn();
const mockGet = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: mockPing,
    set: mockSet,
    get: mockGet,
  }));
});

import redisTestRoute from '../../../main/routes/redis-test';

describe('Redis test route', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    redisTestRoute(app);
  });

  describe('on GET', () => {
    test('should return success when Redis ping, set and get work', async () => {
      mockPing.mockResolvedValue('PONG');
      mockSet.mockResolvedValue('OK');
      mockGet.mockResolvedValue('working-123');

      jest.spyOn(Date, 'now').mockReturnValue(123);

      const res = await request(app).get('/redis-test').expect(200);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ping: 'PONG',
        redisWriteReadSuccess: true,
        value: 'working-123',
      });

      expect(mockPing).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith('redis:test', 'working-123');
      expect(mockGet).toHaveBeenCalledWith('redis:test');

      jest.restoreAllMocks();
    });

    test('should return false when Redis get value does not match written value', async () => {
      mockPing.mockResolvedValue('PONG');
      mockSet.mockResolvedValue('OK');
      mockGet.mockResolvedValue('different-value');

      jest.spyOn(Date, 'now').mockReturnValue(123);

      const res = await request(app).get('/redis-test').expect(200);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ping: 'PONG',
        redisWriteReadSuccess: false,
        value: 'different-value',
      });

      jest.restoreAllMocks();
    });

    test('should return 500 when Redis ping fails', async () => {
      mockPing.mockRejectedValue(new Error('Redis connection failed'));

      const res = await request(app).get('/redis-test').expect(500);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Redis connection failed',
      });

      expect(mockSet).not.toHaveBeenCalled();
      expect(mockGet).not.toHaveBeenCalled();
    });

    test('should return 500 when Redis set fails', async () => {
      mockPing.mockResolvedValue('PONG');
      mockSet.mockRejectedValue(new Error('Redis set failed'));

      const res = await request(app).get('/redis-test').expect(500);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Redis set failed',
      });

      expect(mockGet).not.toHaveBeenCalled();
    });

    test('should return 500 when Redis get fails', async () => {
      mockPing.mockResolvedValue('PONG');
      mockSet.mockResolvedValue('OK');
      mockGet.mockRejectedValue(new Error('Redis get failed'));

      const res = await request(app).get('/redis-test').expect(500);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Redis get failed',
      });
    });
  });
});
