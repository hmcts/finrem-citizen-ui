import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import RedisStore from 'connect-redis';
import type { Express } from 'express';
import session = require('express-session');
import { Redis } from 'ioredis';

const logger = Logger.getLogger('session');

export function parseSessionSecret(raw: string): string | string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('[')) {
    return raw;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.every((s): s is string => typeof s === 'string')) {
      return parsed;
    }
    return raw;
  } catch {
    return raw;
  }
}

export class Session {
  public enableFor(app: Express): void {
    const isRedisEnabled = config.get<string>('features.redis') === 'true';
    const secure = process.env.NODE_ENV === 'production';
    const ttlInSeconds = config.get<number>('session.ttlInSeconds');
    const rawSecret = config.get<string>('secrets.finrem.session-secret');
    const secret = parseSessionSecret(rawSecret);

    let store: session.Store | undefined;

    if (isRedisEnabled) {
      const redisConnectionString = config.get<string>('secrets.finrem.redis-connection-string');
      const redis = new Redis(redisConnectionString);

      redis.on('connect', () => logger.info('Redis session store connected'));
      redis.on('error', (err: Error) => logger.error('Redis session store error:', err));

      app.locals.redisClient = redis;

      store = new RedisStore({
        client: redis,
        prefix: config.get<string>('session.prefix') + ':',
        ttl: ttlInSeconds,
      }) as session.Store;

      logger.info('Session configured with Redis store');
    } else {
      logger.info('Session configured with in-memory store');
    }

    const sessionOptions: session.SessionOptions = {
      cookie: {
        maxAge: ttlInSeconds * 1000,
        sameSite: secure ? 'strict' : 'lax',
        secure,
      },
      name: config.get<string>('session.cookieName'),
      resave: false,
      rolling: true,
      saveUninitialized: false,
      secret,
      ...(store ? { store } : {}),
    };

    app.set('trust proxy', true);
    app.use(session(sessionOptions));
  }
}
