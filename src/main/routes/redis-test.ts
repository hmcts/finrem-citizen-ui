import { Express, Request, Response } from 'express';
import Redis from 'ioredis';

const redis = new Redis({
  host: 'finrem-citizen-ui-redis-master',
  port: 6379,
});

export default function redisTestRoute(app: Express): void {
  app.get('/redis-test', async (_req: Request, res: Response) => {
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
}
