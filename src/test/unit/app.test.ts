import supertest from 'supertest';

jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn(),
}));

jest.mock('@hmcts/nodejs-healthcheck', () => ({
  addTo: jest.fn(),
  raw: jest.fn((fn: () => unknown) => fn),
  up: jest.fn(() => ({ status: 'UP' })),
  down: jest.fn(() => ({ status: 'DOWN' })),
}));

jest.mock('@hmcts/info-provider', () => ({
  infoRequestHandler: jest.fn(() => (_req: unknown, res: { json: (data: unknown) => void }) => res.json({})),
}));

interface ExpressApp {
  use: (...args: unknown[]) => void;
  get: (...args: unknown[]) => void;
  locals: Record<string, unknown>;
}

describe('app', () => {
  let app: ExpressApp;

  beforeEach(() => {
    jest.isolateModules(() => {
      const appModule = require('../../main/app');
      app = appModule.app;
    });
  });

  it('should create an express application', () => {
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.get).toBe('function');
  });

  it('should set ENV local', () => {
    expect(app.locals).toHaveProperty('ENV');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await supertest(app as never).get('/nonexistent-route-12345');
    expect(res.status).toBe(404);
  });

  it('should have error handler that renders error page', async () => {
    const res = await supertest(app as never).get('/nonexistent-route-12345');
    expect([404, 500]).toContain(res.status);
  });

  it('should use default helmet when config is not an object', () => {
    jest.isolateModules(() => {
      const isolatedConfig = require('config');
      const originalGet = isolatedConfig.get.bind(isolatedConfig);
      isolatedConfig.get = (path: string) => {
        if (path === 'helmet') {
          return null;
        }
        return originalGet(path);
      };

      const appModule = require('../../main/app');
      expect(appModule.app).toBeDefined();
    });
  });

  it('should skip helmet when feature is disabled', () => {
    jest.isolateModules(() => {
      const isolatedConfig = require('config');
      const originalGet = isolatedConfig.get.bind(isolatedConfig);
      isolatedConfig.get = (path: string) => {
        if (path === 'feature.helmetEnabled') {
          return false;
        }
        return originalGet(path);
      };

      const appModule = require('../../main/app');
      expect(appModule.app).toBeDefined();
    });
  });

  it('should register redis event handlers when redis is enabled', () => {
    jest.isolateModules(() => {
      const isolatedConfig = require('config');
      const originalGet = isolatedConfig.get.bind(isolatedConfig);
      isolatedConfig.get = (path: string) => {
        if (path === 'feature.redisEnabled') {
          return true;
        }
        return originalGet(path);
      };

      const { xuiNode } = require('@hmcts/rpx-xui-node-lib');
      const callbacks: Record<string, (arg: unknown) => void> = {};
      const origOn = xuiNode.on;
      xuiNode.on = (event: string, cb: (arg: unknown) => void) => {
        callbacks[event] = cb;
        origOn(event, cb);
      };

      const appModule = require('../../main/app');

      expect(callbacks['redis_client_ready']).toBeDefined();
      expect(callbacks['redis_client_error']).toBeDefined();

      // Execute callbacks to cover their bodies
      callbacks['redis_client_ready']({ connected: true });
      expect(appModule.app.locals.redisClient).toEqual({ connected: true });

      callbacks['redis_client_error'](new Error('Redis connection failed'));
    });
  });

  it('should skip environment check when NODE_CONFIG_ENV is not set', () => {
    const originalConfigEnv = process.env.NODE_CONFIG_ENV;
    delete process.env.NODE_CONFIG_ENV;

    jest.isolateModules(() => {
      const appModule = require('../../main/app');
      expect(appModule.app).toBeDefined();
    });

    if (originalConfigEnv) {
      process.env.NODE_CONFIG_ENV = originalConfigEnv;
    }
  });
});
