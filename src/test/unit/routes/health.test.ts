import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { Application } from 'express';

const mockLogger = {
  error: jest.fn(),
};

const addTo = jest.fn();
const raw = jest.fn((callback: unknown) => ({ type: 'raw', callback }));
const web = jest.fn((url: string) => ({ type: 'web', url }));
const up = jest.fn(() => ({ status: 'UP' }));
const down = jest.fn(() => ({ status: 'DOWN' }));

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn(() => mockLogger),
  },
}));

jest.mock('config', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('@hmcts/nodejs-healthcheck', () => ({
  addTo,
  raw,
  web,
  up,
  down,
}));

jest.mock('../../../main/app', () => ({
  app: {
    locals: {},
  },
}));

import config from 'config';

import health from '../../../main/routes/health';

type ConfigModule = {
  get: <T>(key: string) => T;
};

describe('health route', () => {
  const mockedConfig = config as unknown as jest.Mocked<ConfigModule>;

  function mockConfig(sessionStore = 'in-memory'): void {
    mockedConfig.get.mockImplementation(<T>(key: string): T => {
      if (key === 'session.store') {
        return sessionStore as T;
      }

      if (key === 'services.case.url') {
        return 'http://ccd.example.test/' as T;
      }

      if (key === 'services.orchestrationService.url') {
        return 'http://orchestrationService.example.test/' as T;
      }

      throw new Error(`Unexpected config key: ${key}`);
    });
  }

  function getRedisHealthCallback(): () => Promise<unknown> {
    return raw.mock.calls[0][0] as () => Promise<unknown>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig();
  });

  test('adds a CCD health check using services.case.url', () => {
    const app = { locals: {} } as Application;

    health(app);

    expect(web).toHaveBeenCalledWith('http://ccd.example.test/health');
    expect(web).toHaveBeenCalledWith('http://orchestrationService.example.test/health');
    expect(addTo).toHaveBeenCalledWith(app, expect.objectContaining({
      checks: expect.objectContaining({
        ccd: { type: 'web', url: 'http://ccd.example.test/health' },
        redis: expect.objectContaining({ type: 'raw' }),
      }),
      readinessChecks: expect.objectContaining({
        shutdownCheck: expect.objectContaining({ type: 'raw' }),
      }),
    }));
  });

  test('redis check is up without ping when session store is in-memory', async () => {
    const app = { locals: {} } as Application;

    health(app);

    await expect(getRedisHealthCallback()()).resolves.toEqual({ status: 'UP' });
  });

  test('redis check pings app redis client when session store is redis', async () => {
    mockConfig('redis');
    const ping = jest.fn<() => Promise<string>>().mockResolvedValue('PONG');
    const app = { locals: { redisClient: { ping } } } as unknown as Application;

    health(app);

    await expect(getRedisHealthCallback()()).resolves.toEqual({ status: 'UP' });
    expect(ping).toHaveBeenCalled();
  });

  test('redis check is down when redis store is selected but client is missing', async () => {
    mockConfig('redis');
    const app = { locals: {} } as Application;

    health(app);

    await expect(getRedisHealthCallback()()).resolves.toEqual({ status: 'DOWN' });
    expect(mockLogger.error).toHaveBeenCalledWith('Redis health check failed: redisClient missing from app.locals');
  });
});
