import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import express from 'express';
import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import { type RedisReply, RedisStore } from 'rate-limit-redis';

const logger = Logger.getLogger('rate-limiter');

const DEFAULT_RATE_LIMIT_WINDOW_MS = 900000; // 15 minutes
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 20;
const DEFAULT_RATE_LIMIT_REDIS_PREFIX = 'finrem-rate-limit:';

type RateLimiterStore = Options['store'];

export const createAuthenticatedRateLimiter = (store?: RateLimiterStore): ReturnType<typeof rateLimit> => {
  return createRateLimiter(
    readRateLimitWindowMs(),
    readRateLimitConfig('rateLimit.maxRequests', DEFAULT_RATE_LIMIT_MAX_REQUESTS),
    store
  );
};

export const createRedisRateLimitStore = (redisClient: Redis): RateLimiterStore => {
  return new RedisStore({
    prefix: readRateLimitRedisPrefix(),
    sendCommand: (command: string, ...args: string[]) => redisClient.call(command, ...args) as Promise<RedisReply>,
  });
};

const createRateLimiter = (windowMs: number, maxRequests: number, store?: RateLimiterStore) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    ...(store ? { store } : {}),
    legacyHeaders: false,
    standardHeaders: 'draft-8',
    skip: req => req.method !== 'POST',
    keyGenerator: rateLimitKeyGenerator,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.session?.user?.id,
        method: req.method,
        path: req.originalUrl,
        userAgent: req.get('user-agent') || '',
      });

      res.status(429).send('Too many requests. Please try again later.');
    },
  });
};

const rateLimitKeyGenerator = (req: express.Request): string => {
  const userId = req.session?.user?.id;
  if (typeof userId === 'string' && userId.trim().length > 0) {
    return `user:${userId}`;
  }

  if (req.ip) {
    return `ip:${ipKeyGenerator(req.ip)}`;
  }

  if (req.socket?.remoteAddress) {
    return `ip:${ipKeyGenerator(req.socket.remoteAddress)}`;
  }

  throw new Error('Unable to generate key for rate limiting: missing IP address');
};

function readRateLimitWindowMs(): number {
  return readRateLimitConfig('rateLimit.windowMs', DEFAULT_RATE_LIMIT_WINDOW_MS);
}

function readRateLimitRedisPrefix(): string {
  try {
    if (!config.has('rateLimit.redisPrefix')) {
      return DEFAULT_RATE_LIMIT_REDIS_PREFIX;
    }

    const value = config.get<string>('rateLimit.redisPrefix');

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    logger.warn('Invalid rate limit config value. Using fallback.', {
      configKey: 'rateLimit.redisPrefix',
      configuredValue: value,
      fallback: DEFAULT_RATE_LIMIT_REDIS_PREFIX,
    });

    return DEFAULT_RATE_LIMIT_REDIS_PREFIX;
  } catch {
    return DEFAULT_RATE_LIMIT_REDIS_PREFIX;
  }
}

function readRateLimitConfig(configKey: string, fallback: number): number {
  try {
    if (!config.has(configKey)) {
      return fallback;
    }

    const value = Number(config.get(configKey));

    if (Number.isInteger(value) && value > 0) {
      return value;
    }

    logger.warn('Invalid rate limit config value. Using fallback.', {
      configKey,
      configuredValue: config.get(configKey),
      fallback,
    });

    return fallback;
  } catch {
    return fallback;
  }
}
