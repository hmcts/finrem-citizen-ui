import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import connectRedis = require('connect-redis');
import type { Express } from 'express';
import fs from 'fs-extra';
import path from 'path';
import session = require('express-session');
import { Redis } from 'ioredis';

const RedisStore = connectRedis(session);
const logger = Logger.getLogger('session');
const DEFAULT_FILE_STORE_PATH = path.join(process.cwd(), '.sessions', 'local-sessions.json');

type SessionStoreMode = 'redis' | 'memory' | 'file';

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

type PersistedSessionData = {
  cookie?: {
    expires?: string | Date | null;
  };
} & Record<string, unknown>;

type PersistedSessionStore = Record<string, PersistedSessionData>;
type StoreGetCallback = Parameters<session.Store['get']>[1];
type StoreSetCallback = Parameters<session.Store['set']>[2];
type StoreDestroyCallback = Parameters<session.Store['destroy']>[1];

function getPersistedCookieExpiry(sessionData: PersistedSessionData): string | Date | null | undefined {
  return sessionData.cookie?.expires;
}

function toPersistedSessionData(sessionData: session.SessionData): PersistedSessionData {
  return JSON.parse(JSON.stringify(sessionData)) as PersistedSessionData;
}

function toRuntimeSessionData(sessionData: PersistedSessionData): session.SessionData {
  return JSON.parse(JSON.stringify(sessionData)) as session.SessionData;
}

class LocalFileSessionStore extends session.Store {
  private readonly filePath: string;

  public constructor(filePath: string) {
    super();
    this.filePath = filePath;
  }

  public get(sid: string, callback: StoreGetCallback): void {
    void this.readStore()
      .then(store => {
        const sessionData = store[sid];

        if (!sessionData) {
          callback(undefined, null);
          return;
        }

        if (this.isExpired(sessionData)) {
          delete store[sid];
          void this.writeStore(store);
          callback(undefined, null);
          return;
        }

        callback(undefined, toRuntimeSessionData(sessionData));
      })
      .catch(error => callback(error));
  }

  public set(sid: string, sessionData: session.SessionData, callback?: StoreSetCallback): void {
    void this.readStore()
      .then(store => {
        store[sid] = toPersistedSessionData(sessionData);
        return this.writeStore(store);
      })
      .then(() => callback?.())
      .catch(error => callback?.(error));
  }

  public destroy(sid: string, callback?: StoreDestroyCallback): void {
    void this.readStore()
      .then(store => {
        delete store[sid];
        return this.writeStore(store);
      })
      .then(() => callback?.())
      .catch(error => callback?.(error));
  }

  private isExpired(sessionData: PersistedSessionData): boolean {
    const expires = getPersistedCookieExpiry(sessionData);

    if (!expires) {
      return false;
    }

    const expiryDate = expires instanceof Date ? expires : new Date(expires);
    return !Number.isNaN(expiryDate.getTime()) && expiryDate.getTime() <= Date.now();
  }

  private async readStore(): Promise<PersistedSessionStore> {
    if (!(await fs.pathExists(this.filePath))) {
      return {};
    }

    const content = await fs.readFile(this.filePath, 'utf-8');
    if (!content.trim()) {
      return {};
    }

    return JSON.parse(content) as PersistedSessionStore;
  }

  private async writeStore(store: PersistedSessionStore): Promise<void> {
    await fs.ensureDir(path.dirname(this.filePath));
    await fs.writeFile(this.filePath, JSON.stringify(store), 'utf-8');
  }
}

export class Session {
  public enableFor(app: Express): void {
    const typedApp = app as AppWithRedis;
    const secure = process.env.NODE_ENV === 'production';
    const ttlInSeconds = config.get<number>('session.ttlInSeconds');
    const rawSecret = config.get<string>('secrets.finrem.session-secret');
    const secret = parseSessionSecret(rawSecret);
    const configuredStore = config.get<SessionStoreMode>('session.store');

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

    if (configuredStore === 'memory') {
      logger.info('Session configured with in-memory store');
      app.set('trust proxy', true);
      app.use(session(sessionOptions));
      return;
    }

    let store: session.Store;

    if (configuredStore === 'file') {
      const fileStorePath = config.has('session.fileStorePath')
        ? config.get<string>('session.fileStorePath')
        : DEFAULT_FILE_STORE_PATH;
      store = new LocalFileSessionStore(fileStorePath);
      logger.info(`Session configured with file store at ${fileStorePath}`);
    } else {
      const redisConnectionString = config.get<string>('secrets.finrem.finrem-citizen-ui-redis-connection-string');
      const redis = new Redis(redisConnectionString);

      redis.on('ready', () => {
        logger.info('Redis session store connected and ready');
      });

      redis.on('error', (error: Error) => {
        logger.error('Redis session store error', error);
      });

      typedApp.locals.redisClient = redis;

      store = new RedisStore({
        client: redis,
        prefix: `${config.get<string>('session.prefix')}:`,
        ttl: ttlInSeconds,
      }) as session.Store;

      logger.info('Session configured with Redis store');
    }

    app.set('trust proxy', true);
    app.use(
      session({
        ...sessionOptions,
        store,
      })
    );
  }
}
