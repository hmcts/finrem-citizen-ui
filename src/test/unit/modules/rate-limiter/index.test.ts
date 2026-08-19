import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const rateLimitMock = jest.fn((_options?: unknown) => (_req: unknown, _res: unknown, next: () => void) => next());
const ipKeyGeneratorMock = jest.fn((ip: string) => `hashed:${ip}`);
const redisStoreMock = jest.fn((options: unknown) => ({ options }));
const infoMock = jest.fn();
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
    getLogger: () => ({ info: infoMock, warn: warnMock }),
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

const DEFAULT_WINDOW_MS = 900000;
const DEFAULT_MAX_REQUESTS = 100;
const DEFAULT_REDIS_PREFIX = 'finrem-rate-limit:';

type LimiterConfig = {
  skip: (req: { method: string }) => boolean;
  keyGenerator: (req: {
    session?: { user?: { id?: string } };
    ip?: string;
    socket?: { remoteAddress?: string };
  }) => string;
};

function mockConfig(configValues: Record<string, unknown>): void {
  configHasMock.mockImplementation(
    (key: unknown) => Object.prototype.hasOwnProperty.call(configValues, String(key))
  );
  configGetMock.mockImplementation((key: unknown) => configValues[String(key)]);
}

function createLimiterConfig(redisClient?: { call: (...args: string[]) => Promise<unknown> }): LimiterConfig {
  createDefaultRateLimiter(redisClient as never);
  return rateLimitMock.mock.calls[0][0] as LimiterConfig;
}

describe('rate limiter config fallback behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configHasMock.mockReturnValue(false);
  });

  it('uses fallback when rateLimit.maxRequests config is missing', () => {
    createDefaultRateLimiter();

    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({
      windowMs: DEFAULT_WINDOW_MS,
      max: DEFAULT_MAX_REQUESTS,
    }));
  });

  it('uses configured max when config value is a positive integer', () => {
    mockConfig({ 'rateLimit.maxRequests': '321' });

    createDefaultRateLimiter();

    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ max: 321 }));
  });

  it('falls back and logs warning when configured max is invalid', () => {
    mockConfig({ 'rateLimit.maxRequests': 'not-a-number' });

    createDefaultRateLimiter();

    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ max: DEFAULT_MAX_REQUESTS }));
    expect(warnMock).toHaveBeenCalledWith(
      'Invalid rate limit config value. Using fallback.',
      expect.objectContaining({
        configKey: 'rateLimit.maxRequests',
        configuredValue: 'not-a-number',
        fallback: DEFAULT_MAX_REQUESTS,
      })
    );
  });

  it('uses configured window when rateLimit.windowMs is set', () => {
    mockConfig({ 'rateLimit.windowMs': '120000' });

    createDefaultRateLimiter();

    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ windowMs: 120000 }));
  });

  it('creates and passes redis store when redis client is provided', () => {
    const redisClient = { call: jest.fn(async () => 'OK') };

    createDefaultRateLimiter(redisClient as never);

    expect(redisStoreMock).toHaveBeenCalledTimes(1);
    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({
      store: expect.objectContaining({ options: expect.any(Object) }),
      max: DEFAULT_MAX_REQUESTS,
    }));
  });

  it('creates redis store using configured prefix and redis call command bridge', async () => {
    mockConfig({ 'rateLimit.redisPrefix': 'custom-rl:' });

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
    mockConfig({ 'rateLimit.redisPrefix': '   ' });

    createRedisRateLimitStore({ call: jest.fn() } as never);

    expect(redisStoreMock).toHaveBeenCalledWith(expect.objectContaining({ prefix: DEFAULT_REDIS_PREFIX }));
    expect(warnMock).toHaveBeenCalledWith(
      'Invalid rate limit config value. Using fallback.',
      expect.objectContaining({
        configKey: 'rateLimit.redisPrefix',
        configuredValue: '   ',
        fallback: DEFAULT_REDIS_PREFIX,
      })
    );
  });

  it('skips non-POST requests', () => {
    const limiterConfig = createLimiterConfig();

    expect(limiterConfig.skip({ method: 'GET' })).toBe(true);
    expect(limiterConfig.skip({ method: 'POST' })).toBe(false);
  });

  it('uses IDAM user id for rate limit key when available', () => {
    const limiterConfig = createLimiterConfig();

    const key = limiterConfig.keyGenerator({
      session: { user: { id: '12345' } },
      ip: '10.10.10.10',
    });

    expect(key).toBe('user:12345');
    expect(ipKeyGeneratorMock).not.toHaveBeenCalled();
  });

  it('falls back to IP key when user id is missing', () => {
    const limiterConfig = createLimiterConfig();

    const key = limiterConfig.keyGenerator({ ip: '10.10.10.10' });

    expect(key).toBe('ip:hashed:10.10.10.10');
    expect(ipKeyGeneratorMock).toHaveBeenCalledWith('10.10.10.10');
  });
});
