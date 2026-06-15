import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import { RedisStore } from 'connect-redis';
import type { Express } from 'express';
import session = require('express-session');
import { Redis } from 'ioredis';

const logger = Logger.getLogger('session');

export const SESSION_STORE_IN_MEMORY = 'in-memory';
export const SESSION_STORE_REDIS = 'redis';

export type SessionStoreType = typeof SESSION_STORE_IN_MEMORY | typeof SESSION_STORE_REDIS;

export function parseSessionSecret(raw: string): string | string[] {
  const trimmed = raw.trim();

  if (!trimmed.startsWith('[')) {
    return raw;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (Array.isArray(parsed) && parsed.every((value): value is string => typeof value === 'string')) {
      return parsed;
    }

    return raw;
  } catch {
    return raw;
  }
}

export function parseSessionStore(raw: string): SessionStoreType {
  const normalized = raw.trim().toLowerCase().replace(/[\s_]+/g, '-');

  if (normalized === SESSION_STORE_REDIS) {
    return SESSION_STORE_REDIS;
  }

  if (normalized === SESSION_STORE_IN_MEMORY || normalized === 'memory' || normalized === 'inmemory') {
    return SESSION_STORE_IN_MEMORY;
  }

  throw new Error(`Unsupported session.store "${raw}". Expected "in-memory" or "redis".`);
}

export function getSessionStoreType(): SessionStoreType {
  return parseSessionStore(config.get<string>('session.store'));
}

type AppWithRedis = Express & {
  locals: Express['locals'] & {
    redisClient?: Redis;
  };
};

export class Session {
  public enableFor(app: Express): void {
    const typedApp = app as AppWithRedis;
    const secure = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    const configuredStore = getSessionStoreType();
    const storeType = isTest ? SESSION_STORE_IN_MEMORY : configuredStore;
    const ttlInSeconds = config.get<number>('session.ttlInSeconds');
    const rawSecret = config.get<string>('secrets.finrem.session-secret');
    const secret = parseSessionSecret(rawSecret);

    const cookieOptions: session.CookieOptions = {
      maxAge: ttlInSeconds * 1000,
      sameSite: secure ? 'none' : 'lax',
      secure,
    };

    const sessionOptions: session.SessionOptions = {
      cookie: cookieOptions,
      name: config.get<string>('session.cookieName'),
      resave: false,
      rolling: true,
      saveUninitialized: false,
      secret,
    };

    logger.info(
      `Session cookie settings: sameSite=${cookieOptions.sameSite} secure=${cookieOptions.secure}`
    );

    app.set('trust proxy', true);

    if (storeType === SESSION_STORE_IN_MEMORY) {
      delete typedApp.locals.redisClient;
      logger.info(`Session configured with ${SESSION_STORE_IN_MEMORY} store`);

      if (secure) {
        logger.warn('Session configured with in-memory store in production');
      }

      app.use(session(sessionOptions));
      return;
    }

    const redisConnectionString = config.get<string>('secrets.finrem.finrem-citizen-ui-redis-connection-string');
    const redis = new Redis(redisConnectionString);

    // c8 ignore next 30
    redis.on('ready', async () => {
      logger.info('Redis session store connected and ready');

      try {
        const testKey = 'debug:test:key';
        const testValue = JSON.stringify({
          message: 'hello redis',
          ts: new Date().toISOString(),
        });

        await redis.set(testKey, testValue, 'EX', 300);
        logger.info(`Redis SET successful for key=${testKey}`);

        const value = await redis.get(testKey);
        logger.info(`Redis GET returned: ${value}`);

        const ttl = await redis.ttl(testKey);
        logger.info(`Redis TTL for ${testKey}: ${ttl}`);
      } catch (err) {
        logger.error('Redis SET/GET test failed', err);
      }
    });

    redis.on('error', (error: Error) => {
      logger.error('Redis session store error', error);
    });

    typedApp.locals.redisClient = redis;

    const store = new RedisStore({
      client: redis,
      prefix: `${config.get<string>('session.prefix')}:`,
      ttl: ttlInSeconds,
    }) as session.Store;

    logger.info('Session configured with Redis store');

    app.use(
      session({
        ...sessionOptions,
        store,
      })
    );
  }
}
