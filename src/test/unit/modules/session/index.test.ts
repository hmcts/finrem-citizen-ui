import express from 'express';

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
  },
}));

jest.mock('connect-redis', () => ({
  __esModule: true,
  default: {
    RedisStore: class MockRedisStore {
      public get = jest.fn();
      public set = jest.fn();
      public destroy = jest.fn();
    },
  },
}));

const redisOnMock = jest.fn();
const redisQuitMock = jest.fn();

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    on: redisOnMock,
    quit: redisQuitMock,
  })),
}));

jest.mock('express-session', () => {
  const mockSession = jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next());
  (mockSession as jest.Mock & { Store: object }).Store = class {};
  return mockSession;
});

jest.mock('config', () => ({
  get: jest.fn(),
}));

const mockSessionMiddleware = jest.requireMock('express-session') as jest.Mock;
const configGetMock = (jest.requireMock('config') as { get: jest.Mock }).get;
const redisModule = jest.requireMock('ioredis') as { Redis: jest.Mock };

import { parseSessionSecret,Session } from '../../../../main/modules/session/index';

describe('parseSessionSecret', () => {
  it('returns plain string unchanged', () => {
    expect(parseSessionSecret('my-secret')).toBe('my-secret');
  });

  it('returns JSON array of strings as an array', () => {
    const result = parseSessionSecret('["secret1","secret2"]');
    expect(result).toEqual(['secret1', 'secret2']);
  });

  it('returns raw string when JSON parses to a non-array', () => {
    const input = '{"key":"value"}';
    expect(parseSessionSecret(input)).toBe(input);
  });

  it('returns raw string when JSON array contains non-strings', () => {
    const input = '[1,2,3]';
    expect(parseSessionSecret(input)).toBe(input);
  });

  it('returns raw string when JSON starting with [ is invalid', () => {
    const input = '[invalid json';
    expect(parseSessionSecret(input)).toBe(input);
  });

  it('trims whitespace before checking for JSON', () => {
    const result = parseSessionSecret('  ["s1","s2"]  ');
    expect(result).toEqual(['s1', 's2']);
  });

  it('returns string that does not start with [ unchanged', () => {
    expect(parseSessionSecret('plain-string')).toBe('plain-string');
  });
});

describe('Session.enableFor', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    configGetMock.mockImplementation((key: string) => {
      const map: Record<string, unknown> = {
        'session.ttlInSeconds': 3600,
        'secrets.finrem.session-secret': 'test-secret',
        'session.cookieName': 'finrem_session',
        'session.prefix': 'finrem-session',
        'secrets.finrem.finrem-citizen-ui-redis-connection-string': 'redis://localhost:6379',
      };

      return map[key];
    });
  });

  it('configures session with in-memory store in test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const session = new Session();
    const app = express();

    session.enableFor(app);

    expect(redisModule.Redis).not.toHaveBeenCalled();

    expect(mockSessionMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        resave: false,
        saveUninitialized: false,
        rolling: true,
        name: 'finrem_session',
        secret: 'test-secret',
      })
    );

    const callArg = mockSessionMiddleware.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.store).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('configures session with Redis store outside test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const session = new Session();
    const app = express();

    session.enableFor(app);

    expect(redisModule.Redis).toHaveBeenCalledWith('redis://localhost:6379');

    expect(mockSessionMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        resave: false,
        saveUninitialized: false,
        rolling: true,
        name: 'finrem_session',
        secret: 'test-secret',
        store: expect.anything(),
      })
    );

    const callArg = mockSessionMiddleware.mock.calls[0][0] as {
      cookie: {
        maxAge: number;
        sameSite: string;
        secure: boolean;
      };
      store: unknown;
    };

    expect(callArg.store).toBeDefined();
    expect(callArg.cookie.maxAge).toBe(3600 * 1000);

    process.env.NODE_ENV = originalEnv;
  });

  it('stores redis client on app.locals outside test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const session = new Session();
    const app = express();

    session.enableFor(app);

    expect(app.locals.redisClient).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('registers redis connect and error handlers outside test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const session = new Session();
    const app = express();

    session.enableFor(app);

    expect(redisOnMock).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(redisOnMock).toHaveBeenCalledWith('error', expect.any(Function));

    process.env.NODE_ENV = originalEnv;
  });

  it('parses JSON array session secret', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    configGetMock.mockImplementation((key: string) => {
      if (key === 'secrets.finrem.session-secret') {
        return '["s1","s2"]';
      }

      const map: Record<string, unknown> = {
        'session.ttlInSeconds': 3600,
        'session.cookieName': 'finrem_session',
        'session.prefix': 'finrem-session',
        'secrets.finrem.finrem-citizen-ui-redis-connection-string': 'redis://localhost:6379',
      };

      return map[key];
    });

    const session = new Session();
    const app = express();

    session.enableFor(app);

    const callArg = mockSessionMiddleware.mock.calls[0][0] as {
      secret: string | string[];
    };

    expect(callArg.secret).toEqual(['s1', 's2']);

    process.env.NODE_ENV = originalEnv;
  });

  it('sets secure cookie in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const session = new Session();
    const app = express();

    session.enableFor(app);

    const callArg = mockSessionMiddleware.mock.calls[0][0] as {
      cookie: {
        secure: boolean;
        sameSite: string;
      };
    };

    expect(callArg.cookie.secure).toBe(true);
    expect(callArg.cookie.sameSite).toBe('none');

    process.env.NODE_ENV = originalEnv;
  });

  it('sets lax cookie outside production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const session = new Session();
    const app = express();

    session.enableFor(app);

    const callArg = mockSessionMiddleware.mock.calls[0][0] as {
      cookie: {
        secure: boolean;
        sameSite: string;
      };
    };

    expect(callArg.cookie.secure).toBe(false);
    expect(callArg.cookie.sameSite).toBe('lax');

    process.env.NODE_ENV = originalEnv;
  });
});
