import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express, { Application } from 'express';
import request from 'supertest';

jest.mock('config', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    has: jest.fn(),
    util: {
      toObject: jest.fn(),
    },
  },
}));

import config from 'config';

import setupConfigRoute from '../../../main/routes/config';

type ConfigModule = {
  get: <T>(key: string) => T;
  has: (key: string) => boolean;
  util: {
    toObject: () => Record<string, unknown>;
  };
};

describe('config route', () => {
  let app: Application;
  const mockedConfig = config as unknown as jest.Mocked<ConfigModule>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    jest.clearAllMocks();
    
    mockedConfig.util.toObject.mockReturnValue({
      useCSRFProtection: true,
      appInsights: {},
      security: {},
      services: {},
      oidc: {},
      session: {},
      rateLimitWindowMs: 900000,
    });
    
    mockedConfig.has.mockReturnValue(true);
    
    mockedConfig.get.mockImplementation(<T>(key: string): T => {
      const mockData: Record<string, unknown> = {
        useCSRFProtection: true,
        appInsights: {
          connectionString: 'InstrumentationKey=test-key',
        },
        security: {
          referrerPolicy: 'same-origin',
        },
        services: {
          idam: {
            systemUsername: 'test_user',
            systemPassword: 'secret_password',
            clientID: 'finrem-citizen-ui',
            clientSecret: 'super_secret',
            authorizationURL: 'https://idam.test',
            tokenURL: 'https://idam-api.test/o/token',
          },
          authProvider: {
            url: 'http://auth-provider.test',
            microservice: 'finrem_citizen_ui',
            secret: 'auth_secret',
          },
          case: {
            url: 'http://ccd.test',
          },
        },
        oidc: {
          issuer: 'https://idam.test/o',
          clientId: 'finrem-citizen-ui',
          callbackUrl: 'http://localhost:3100/oauth2/callback',
          scope: 'openid profile roles',
        },
        session: {
          cookieName: 'finrem_session',
          prefix: 'finrem-session',
          store: 'in-memory',
          ttlInSeconds: 5400,
        },
        rateLimitWindowMs: 900000,
      };
      
      return mockData[key] as T;
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('environment gating', () => {
    test('returns 404 in production environment', async () => {
      process.env.NODE_ENV = 'production';
      setupConfigRoute(app);

      const response = await request(app).get('/config');

      expect(response.status).toBe(404);
      expect(response.text).toBe('Not Found');
    });

    test('returns 200 in local environment', async () => {
      process.env.NODE_ENV = 'local';
      setupConfigRoute(app);

      const response = await request(app).get('/config');

      expect(response.status).toBe(200);
    });

    test('returns 200 in development environment', async () => {
      process.env.NODE_ENV = 'development';
      setupConfigRoute(app);

      const response = await request(app).get('/config');

      expect(response.status).toBe(200);
    });

    test('returns 200 in test environment', async () => {
      process.env.NODE_ENV = 'test';
      setupConfigRoute(app);

      const response = await request(app).get('/config');

      expect(response.status).toBe(200);
    });

    test('returns 200 in aat environment', async () => {
      process.env.NODE_ENV = 'aat';
      setupConfigRoute(app);

      const response = await request(app).get('/config');

      expect(response.status).toBe(200);
    });

    test('returns 200 in preview environment', async () => {
      process.env.NODE_ENV = 'preview';
      setupConfigRoute(app);

      const response = await request(app).get('/config');

      expect(response.status).toBe(200);
    });

    test('returns 404 in staging environment (not in allowed list)', async () => {
      process.env.NODE_ENV = 'staging';
      setupConfigRoute(app);

      const response = await request(app).get('/config');

      expect(response.status).toBe(404);
    });

    test('defaults to development when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV;
      setupConfigRoute(app);

      const response = await request(app).get('/config');

      expect(response.status).toBe(200);
    });
  });

  describe('config response', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      setupConfigRoute(app);
    });

    test('returns JSON response', async () => {
      const response = await request(app).get('/config');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    test('only includes URL-related config values', async () => {
      const response = await request(app).get('/config');

      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('oidc');
      expect(response.body).not.toHaveProperty('useCSRFProtection');
      expect(response.body).not.toHaveProperty('rateLimitWindowMs');
      expect(response.body).not.toHaveProperty('appInsights');
      expect(response.body).not.toHaveProperty('security');
      expect(response.body).not.toHaveProperty('session');
    });

    test('excludes secrets section from response', async () => {
      mockedConfig.util.toObject.mockReturnValue({
        useCSRFProtection: true,
        secrets: {
          finrem: {
            'session-secret': 'very-secret',
          },
        },
      });

      const response = await request(app).get('/config');

      expect(response.body).not.toHaveProperty('secrets');
    });

    test('excludes systemPassword and systemUsername from services config', async () => {
      const response = await request(app).get('/config');

      expect(response.body.services.idam.systemPassword).toBeUndefined();
      expect(response.body.services.idam.systemUsername).toBeUndefined();
    });

    test('excludes clientSecret and clientID from services config', async () => {
      const response = await request(app).get('/config');

      expect(response.body.services.idam.clientSecret).toBeUndefined();
      expect(response.body.services.idam.clientID).toBeUndefined();
    });

    test('excludes secret and microservice from authProvider config', async () => {
      const response = await request(app).get('/config');

      expect(response.body.services.authProvider.secret).toBeUndefined();
      expect(response.body.services.authProvider.microservice).toBeUndefined();
      expect(response.body.services.authProvider.url).toBe('http://auth-provider.test');
    });

    test('includes non-sensitive service URLs', async () => {
      const response = await request(app).get('/config');

      expect(response.body.services.case.url).toBe('http://ccd.test');
      expect(response.body.services.idam.authorizationURL).toBe('https://idam.test');
      expect(response.body.services.idam.tokenURL).toBe('https://idam-api.test/o/token');
    });

    test('includes only URL fields from OIDC configuration', async () => {
      const response = await request(app).get('/config');

      expect(response.body.oidc).toEqual({
        issuer: 'https://idam.test/o',
        callbackUrl: 'http://localhost:3100/oauth2/callback',
      });
      expect(response.body.oidc.clientId).toBeUndefined();
      expect(response.body.oidc.scope).toBeUndefined();
    });

    test('excludes session configuration', async () => {
      const response = await request(app).get('/config');

      expect(response.body.session).toBeUndefined();
    });
  });
});
