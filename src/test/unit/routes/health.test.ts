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

  beforeEach(() => {
    jest.clearAllMocks();
    mockedConfig.get.mockImplementation(<T>(key: string): T => {
      if (key === 'features.redis') {
        return 'false' as T;
      }

      if (key === 'services.case.url') {
        return 'http://ccd.example.test/' as T;
      }

      throw new Error(`Unexpected config key: ${key}`);
    });
  });

  test('adds a CCD health check using services.case.url', () => {
    const app = { locals: {} } as Application;

    health(app);

    expect(web).toHaveBeenCalledWith('http://ccd.example.test/health');
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
});
