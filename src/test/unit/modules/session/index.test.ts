import express from 'express';

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
  },
}));

jest.mock('connect-redis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    destroy: jest.fn(),
  }));
});

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
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

import { Session, parseSessionSecret } from '../../../../main/modules/session/index';

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
        'features.redis': 'false',
        'session.ttlInSeconds': 3600,
        'secrets.finrem.session-secret': 'test-secret',
        'session.cookieName': 'finrem_session',
        'session.prefix': 'finrem-session',
        'secrets.finrem.redis-connection-string': 'redis://localhost:6379',
      };
      return map[key];
    });
  });

  it('configures session with memory store when redis is disabled', () => {
    const session = new Session();
    const app = express();
    session.enableFor(app);

    expect(mockSessionMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        resave: false,
        saveUninitialized: false,
        rolling: true,
      })
    );

    const callArg = mockSessionMiddleware.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg['store']).toBeUndefined();
  });

  it('configures session with Redis store when redis is enabled', () => {
    configGetMock.mockImplementation((key: string) => {
      const map: Record<string, unknown> = {
        'features.redis': 'true',
        'session.ttlInSeconds': 3600,
        'secrets.finrem.session-secret': 'test-secret',
        'session.cookieName': 'finrem_session',
        'session.prefix': 'finrem-session',
        'secrets.finrem.redis-connection-string': 'redis://localhost:6379',
      };
      return map[key];
    });

    const session = new Session();
    const app = express();
    session.enableFor(app);

    expect(mockSessionMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        resave: false,
        saveUninitialized: false,
      })
    );

    const callArg = mockSessionMiddleware.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg['store']).toBeDefined();
  });

  it('parses JSON array session secret', () => {
    configGetMock.mockImplementation((key: string) => {
      if (key === 'secrets.finrem.session-secret') {
        return '["s1","s2"]';
      }
      const map: Record<string, unknown> = {
        'features.redis': 'false',
        'session.ttlInSeconds': 3600,
        'session.cookieName': 'finrem_session',
        'session.prefix': 'finrem-session',
      };
      return map[key];
    });

    const session = new Session();
    const app = express();
    session.enableFor(app);

    const callArg = mockSessionMiddleware.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg['secret']).toEqual(['s1', 's2']);
  });

  it('sets secure cookie in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const session = new Session();
    const app = express();
    session.enableFor(app);

    const callArg = mockSessionMiddleware.mock.calls[0][0] as Record<string, unknown>;
    const cookie = callArg['cookie'] as Record<string, unknown>;
    expect(cookie['secure']).toBe(true);
    expect(cookie['sameSite']).toBe('strict');

    process.env.NODE_ENV = originalEnv;
  });

  it('sets lax cookie in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const session = new Session();
    const app = express();
    session.enableFor(app);

    const callArg = mockSessionMiddleware.mock.calls[0][0] as Record<string, unknown>;
    const cookie = callArg['cookie'] as Record<string, unknown>;
    expect(cookie['secure']).toBe(false);
    expect(cookie['sameSite']).toBe('lax');

    process.env.NODE_ENV = originalEnv;
  });
});
