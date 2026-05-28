import { Router } from 'express';
import Redis from 'ioredis';

const router = Router();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT || 6379),
});

router.get('/redis-test', async (_req, res) => {
  try {
    const key = 'redis:test';
    const value = `working-${Date.now()}`;

    const ping = await redis.ping();

    await redis.set(key, value);
    const result = await redis.get(key);

    res.json({
      ping,
      redisWriteReadSuccess: result === value,
      value: result,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
