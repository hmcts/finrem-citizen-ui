import config from 'config';
import RedisStore from 'connect-redis';
import Redis from 'ioredis';

/**
 * Create and configure Redis session store
 *
 * @returns Configured RedisStore instance for express-session
 */
export function createSessionStore(): RedisStore {
  // Read Redis configuration
  const redisHost = config.get<string>('services.redis.host');
  const redisPort = config.get<number>('services.redis.port');

  // Create Redis client
  const redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    // Add retry strategy
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  // Log connection events for debugging
  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });

  redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  // Create and configure RedisStore
  const store = new RedisStore({
    client: redisClient,
    prefix: 'finrem-session:',  // Prefix all session keys
    ttl: 3600,  // Session TTL in seconds (1 hour)
  });

  return store;
}
