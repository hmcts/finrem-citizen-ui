import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import express from 'express';
import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import { type RedisReply, RedisStore } from 'rate-limit-redis';

const logger = Logger.getLogger('rate-limiter');

const DEFAULT_RATE_LIMIT_WINDOW_MS = 900000; // 15 minutes
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;
const DEFAULT_RATE_LIMIT_REDIS_PREFIX = 'finrem-rate-limit:';
const RATE_LIMIT_REDIS_PREFIX_CONFIG_KEY = 'rateLimit.redisPrefix';

type RateLimiterStore = Options['store'];

export const createDefaultRateLimiter = (redisClient?: Redis): ReturnType<typeof rateLimit> => {
  const windowMs = readRateLimitConfig('rateLimit.windowMs', DEFAULT_RATE_LIMIT_WINDOW_MS);
  const maxRequests = readRateLimitConfig('rateLimit.maxRequests', DEFAULT_RATE_LIMIT_MAX_REQUESTS);
  const store = redisClient ? createRedisRateLimitStore(redisClient) : undefined;

  return createRateLimiter(windowMs, maxRequests, store);
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

  throw new Error('Unable to generate key for rate limiting: missing User ID and IP address');
};

function readRateLimitRedisPrefix(): string {
  const value = readConfigValue<string>(RATE_LIMIT_REDIS_PREFIX_CONFIG_KEY);

  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (value !== undefined) {
    logInvalidConfigValue(RATE_LIMIT_REDIS_PREFIX_CONFIG_KEY, value, DEFAULT_RATE_LIMIT_REDIS_PREFIX);
  }

  return DEFAULT_RATE_LIMIT_REDIS_PREFIX;
}

function readRateLimitConfig(configKey: string, fallback: number): number {
  const value = readConfigValue<unknown>(configKey);

  if (value === undefined) {
    return fallback;
  }

  const numericValue = Number(value);
  if (Number.isInteger(numericValue) && numericValue > 0) {
    return numericValue;
  }

  logInvalidConfigValue(configKey, value, fallback);
  return fallback;
}

function readConfigValue<T>(configKey: string): T | undefined {
  try {
    if (!config.has(configKey)) {
      return undefined;
    }

    return config.get<T>(configKey);
  } catch {
    return undefined;
  }
}

function logInvalidConfigValue(configKey: string, configuredValue: unknown, fallback: number | string): void {
  logger.warn('Invalid rate limit config value. Using fallback.', {
    configKey,
    configuredValue,
    fallback,
  });
}
