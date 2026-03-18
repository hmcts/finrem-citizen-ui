import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import connectRedis = require('connect-redis');
import type { Express } from 'express';
import session = require('express-session');
import { Redis } from 'ioredis';

const RedisStore = connectRedis(session);
const logger = Logger.getLogger('session');

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
    const ttlInSeconds = config.get<number>('session.ttlInSeconds');
    const rawSecret = config.get<string>('secrets.finrem.session-secret');
    const secret = parseSessionSecret(rawSecret);

    const sessionOptions: session.SessionOptions = {
      cookie: {
        maxAge: ttlInSeconds * 1000,
        sameSite: secure ? 'none' : 'lax',
        secure,
      },
      name: config.get<string>('session.cookieName'),
      resave: false,
      rolling: true,
      saveUninitialized: false,
      secret,
    };

    logger.info(
      `Session cookie settings: sameSite=${sessionOptions.cookie?.sameSite} secure=${sessionOptions.cookie?.secure}`
    );

    if (isTest) {
      logger.info('Session configured with in-memory store for test environment');
      app.set('trust proxy', true);
      app.use(session(sessionOptions));
      return;
    }

    const redisConnectionString = config.get<string>('secrets.finrem.finrem-citizen-ui-redis-connection-string');
    const redis = new Redis(redisConnectionString);

    redis.on('connect', () => {
      logger.info('Redis session store connected');
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

    app.set('trust proxy', true);
    app.use(
      session({
        ...sessionOptions,
        store,
      })
    );
  }
}
