import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import express from 'express';
import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import { type RedisReply, RedisStore } from 'rate-limit-redis';

import { HttpStatusCodes } from '../../constants/http-status-codes';

const logger = Logger.getLogger('rate-limiter');

const RATE_LIMIT_REDIS_PREFIX_CONFIG_KEY = 'rateLimit.redisPrefix';
const RATE_LIMIT_WINDOW_MS_CONFIG_KEY = 'rateLimit.windowMs';
const RATE_LIMIT_MAX_REQUESTS_CONFIG_KEY = 'rateLimit.maxRequests';
const DEFAULT_RATE_LIMIT_REDIS_PREFIX = 'finrem-rate-limit:';
const DEFAULT_RATE_LIMIT_WINDOW_MS = 900000; // 15 minutes
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;

const RATE_LIMIT_HEADER_FORMAT: Options['standardHeaders'] = 'draft-8';

type RateLimiterStore = Options['store'];

export const createDefaultRateLimiter = (redisClient?: Redis): ReturnType<typeof rateLimit> => {
  const windowMs = readRateLimitConfig(RATE_LIMIT_WINDOW_MS_CONFIG_KEY, DEFAULT_RATE_LIMIT_WINDOW_MS);
  const maxRequests = readRateLimitConfig(RATE_LIMIT_MAX_REQUESTS_CONFIG_KEY, DEFAULT_RATE_LIMIT_MAX_REQUESTS);
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
  logger.info('Creating rate limiter', {
    windowMs,
    maxRequests,
    store: store ? 'Redis' : 'Memory',
  });

  return rateLimit({
    windowMs,
    max: maxRequests,
    ...(store ? { store } : {}),
    legacyHeaders: false,
    standardHeaders: RATE_LIMIT_HEADER_FORMAT,
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

      res.status(HttpStatusCodes.TOO_MANY_REQUESTS).send('Too many requests. Please try again later.');
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

  logInvalidConfigValue(RATE_LIMIT_REDIS_PREFIX_CONFIG_KEY, value, DEFAULT_RATE_LIMIT_REDIS_PREFIX);

  return DEFAULT_RATE_LIMIT_REDIS_PREFIX;
}

function readRateLimitConfig(configKey: string, defaultValue: number): number {
  const value = readConfigValue<unknown>(configKey);

  if (value === undefined) {
    return defaultValue;
  }

  const numericValue = Number(value);
  if (Number.isInteger(numericValue) && numericValue > 0) {
    return numericValue;
  }

  logInvalidConfigValue(configKey, value, defaultValue);

  return defaultValue;
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
