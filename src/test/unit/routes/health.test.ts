jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn(),
}));

interface HealthConfig {
  checks: Record<string, () => { status: string }>;
  readinessChecks: Record<string, () => { status: string }>;
}

jest.mock('@hmcts/nodejs-healthcheck', () => ({
  addTo: jest.fn((_app: unknown, config: HealthConfig) => {
    capturedConfig = config;
  }),
  raw: jest.fn((fn: () => unknown) => fn),
  up: jest.fn(() => ({ status: 'UP' })),
  down: jest.fn(() => ({ status: 'DOWN' })),
}));

jest.mock('@hmcts/info-provider', () => ({
  infoRequestHandler: jest.fn(() => jest.fn()),
}));

let capturedConfig: HealthConfig | null;

describe('routes/health', () => {
  beforeEach(() => {
    capturedConfig = null;
  });

  it('should register health check with checks and readiness checks', () => {
    jest.isolateModules(() => {
      const healthcheck = require('@hmcts/nodejs-healthcheck');
      require('../../../main/app');

      expect(healthcheck.addTo).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          checks: expect.any(Object),
          readinessChecks: expect.any(Object),
        })
      );
    });
  });

  it('should include a sampleCheck in checks', () => {
    jest.isolateModules(() => {
      require('../../../main/app');
      expect(capturedConfig).toBeDefined();
      expect(capturedConfig?.checks).toHaveProperty('sampleCheck');
    });
  });

  it('should include a shutdownCheck in readiness checks', () => {
    jest.isolateModules(() => {
      require('../../../main/app');
      expect(capturedConfig).toBeDefined();
      expect(capturedConfig?.readinessChecks).toHaveProperty('shutdownCheck');
    });
  });

  it('should return UP when app is not shutting down', () => {
    jest.isolateModules(() => {
      const { app } = require('../../../main/app');
      app.locals.shutdown = false;

      const shutdownFn = capturedConfig?.readinessChecks.shutdownCheck;
      const result = shutdownFn?.();
      expect(result).toEqual({ status: 'UP' });
    });
  });

  it('should return DOWN when app is shutting down', () => {
    jest.isolateModules(() => {
      const { app } = require('../../../main/app');
      app.locals.shutdown = true;

      const shutdownFn = capturedConfig?.readinessChecks.shutdownCheck;
      const result = shutdownFn?.();
      expect(result).toEqual({ status: 'DOWN' });
    });
  });

  it('should have a sampleCheck that returns UP', () => {
    jest.isolateModules(() => {
      require('../../../main/app');
      const sampleCheckFn = capturedConfig?.checks.sampleCheck;
      const result = sampleCheckFn?.();
      expect(result).toEqual({ status: 'UP' });
    });
  });
});
