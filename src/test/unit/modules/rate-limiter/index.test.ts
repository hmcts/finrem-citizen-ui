import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const rateLimitMock = jest.fn((_options?: unknown) => (_req: unknown, _res: unknown, next: () => void) => next());
const ipKeyGeneratorMock = jest.fn((ip: string) => `hashed:${ip}`);
const redisStoreMock = jest.fn((options: unknown) => ({ options }));
const warnMock = jest.fn();
const configHasMock = jest.fn();
const configGetMock = jest.fn();

jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: rateLimitMock,
  ipKeyGenerator: ipKeyGeneratorMock,
}));

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: () => ({ warn: warnMock }),
  },
}));

jest.mock('config', () => ({
  has: configHasMock,
  get: configGetMock,
}));

jest.mock('rate-limit-redis', () => ({
  RedisStore: redisStoreMock,
}));

import {
  createDefaultRateLimiter,
  createRedisRateLimitStore,
} from '../../../../main/modules/rate-limiter';

describe('rate limiter config fallback behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configHasMock.mockReturnValue(false);
  });

  it('uses fallback when rateLimit.maxRequests config is missing', () => {
    createDefaultRateLimiter();

    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({
      windowMs: 900000,
      max: 100,
    }));
  });

  it('uses configured max when config value is a positive integer', () => {
    configHasMock.mockImplementation((key: unknown) => key === 'rateLimit.maxRequests');
    configGetMock.mockImplementation((key: unknown) => {
      if (key === 'rateLimit.maxRequests') {
        return '321';
      }

      return undefined;
    });

    createDefaultRateLimiter();

    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ max: 321 }));
  });

  it('falls back and logs warning when configured max is invalid', () => {
    configHasMock.mockImplementation((key: unknown) => key === 'rateLimit.maxRequests');
    configGetMock.mockImplementation((key: unknown) => {
      if (key === 'rateLimit.maxRequests') {
        return 'not-a-number';
      }

      return undefined;
    });

    createDefaultRateLimiter();

    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ max: 100 }));
    expect(warnMock).toHaveBeenCalledWith(
      'Invalid rate limit config value. Using fallback.',
      expect.objectContaining({
        configKey: 'rateLimit.maxRequests',
        configuredValue: 'not-a-number',
        fallback: 100,
      })
    );
  });

  it('uses configured window when rateLimit.windowMs is set', () => {
    configHasMock.mockImplementation((key: unknown) => key === 'rateLimit.windowMs');
    configGetMock.mockImplementation((key: unknown) => {
      if (key === 'rateLimit.windowMs') {
        return '120000';
      }

      return undefined;
    });

    createDefaultRateLimiter();

    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ windowMs: 120000 }));
  });

  it('creates and passes redis store when redis client is provided', () => {
    const redisClient = { call: jest.fn(async () => 'OK') };

    createDefaultRateLimiter(redisClient as never);

    expect(redisStoreMock).toHaveBeenCalledTimes(1);
    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({
      store: expect.objectContaining({ options: expect.any(Object) }),
      max: 100,
    }));
  });

  it('creates redis store using configured prefix and redis call command bridge', async () => {
    configHasMock.mockImplementation((key: unknown) => key === 'rateLimit.redisPrefix');
    configGetMock.mockImplementation((key: unknown) => {
      if (key === 'rateLimit.redisPrefix') {
        return 'custom-rl:';
      }

      return undefined;
    });

    const redisCallMock = jest.fn(async () => 'OK');
    const redisClient = { call: redisCallMock };

    const store = createRedisRateLimitStore(redisClient as never);

    expect(store).toEqual(expect.objectContaining({
      options: expect.objectContaining({ prefix: 'custom-rl:' }),
    }));
    expect(redisStoreMock).toHaveBeenCalledTimes(1);

    const redisStoreOptions = redisStoreMock.mock.calls[0][0] as {
      sendCommand: (command: string, ...args: string[]) => Promise<unknown>;
    };

    await redisStoreOptions.sendCommand('PING', 'hello');

    expect(redisCallMock).toHaveBeenCalled();
    expect(redisCallMock.mock.calls[0]).toEqual(['PING', 'hello']);
  });

  it('falls back to default redis prefix when configured prefix is invalid', () => {
    configHasMock.mockImplementation((key: unknown) => key === 'rateLimit.redisPrefix');
    configGetMock.mockImplementation((key: unknown) => {
      if (key === 'rateLimit.redisPrefix') {
        return '   ';
      }

      return undefined;
    });

    createRedisRateLimitStore({ call: jest.fn() } as never);

    expect(redisStoreMock).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'finrem-rate-limit:' }));
    expect(warnMock).toHaveBeenCalledWith(
      'Invalid rate limit config value. Using fallback.',
      expect.objectContaining({
        configKey: 'rateLimit.redisPrefix',
        configuredValue: '   ',
        fallback: 'finrem-rate-limit:',
      })
    );
  });

  it('skips non-POST requests', () => {
    createDefaultRateLimiter();

    const limiterConfig = rateLimitMock.mock.calls[0][0] as {
      skip: (req: { method: string }) => boolean;
    };

    expect(limiterConfig.skip({ method: 'GET' })).toBe(true);
    expect(limiterConfig.skip({ method: 'POST' })).toBe(false);
  });

  it('uses IDAM user id for rate limit key when available', () => {
    createDefaultRateLimiter();

    const limiterConfig = rateLimitMock.mock.calls[0][0] as {
      keyGenerator: (req: {
        session?: { user?: { id?: string } };
        ip?: string;
        socket?: { remoteAddress?: string };
      }) => string;
    };

    const key = limiterConfig.keyGenerator({
      session: { user: { id: '12345' } },
      ip: '10.10.10.10',
    });

    expect(key).toBe('user:12345');
    expect(ipKeyGeneratorMock).not.toHaveBeenCalled();
  });

  it('falls back to IP key when user id is missing', () => {
    createDefaultRateLimiter();

    const limiterConfig = rateLimitMock.mock.calls[0][0] as {
      keyGenerator: (req: {
        session?: { user?: { id?: string } };
        ip?: string;
        socket?: { remoteAddress?: string };
      }) => string;
    };

    const key = limiterConfig.keyGenerator({ ip: '10.10.10.10' });

    expect(key).toBe('ip:hashed:10.10.10.10');
    expect(ipKeyGeneratorMock).toHaveBeenCalledWith('10.10.10.10');
  });
});
