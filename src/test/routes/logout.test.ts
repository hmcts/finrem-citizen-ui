import express, { Application } from 'express';
import request from 'supertest';

import { RouteNames } from '../../main/common-constants';
import setupLogoutRoute from '../../main/routes/logout';

jest.mock('config', () => ({
  get: jest.fn().mockReturnValue('connect.sid'),
}));

jest.mock('@hmcts/nodejs-logging', () => {
  const logger = {
    error: jest.fn(),
  };

  return {
    Logger: {
      getLogger: jest.fn().mockReturnValue(logger),
    },
  };
});

const { Logger } = require('@hmcts/nodejs-logging');

describe('Logout route', () => {
  let app: Application;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();

    app.use((req, _res, next) => {
      const mockSession = {
        destroy: jest.fn((callback: (err?: Error) => void): void => {
          callback();
        }),
      };

      Object.assign(req, {
        session: mockSession,
      });

      next();
    });

    setupLogoutRoute(app);
  });

  describe('on GET', () => {
    test('should destroy session, clear cookie and redirect to base path', async () => {
      const res = await request(app).get(RouteNames.logout).expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(RouteNames.basePath);

      expect(res.header['set-cookie'][0]).toContain('connect.sid=');
      expect(res.header['set-cookie'][0]).toContain('Path=/');
      expect(res.header['set-cookie'][0]).toContain('HttpOnly');
      expect(res.header['set-cookie'][0]).toContain('Secure');
      expect(res.header['set-cookie'][0]).toContain('SameSite=Lax');
    });

    test('should log error, clear cookie and redirect when session destroy fails', async () => {
      app = express();

      app.use((req, _res, next) => {
        const mockSession = {
          destroy: jest.fn((callback: (err?: Error) => void): void => {
            callback(new Error('Session destroy failed'));
          }),
        };

        Object.assign(req, {
          session: mockSession,
        });

        next();
      });

      setupLogoutRoute(app);

      const res = await request(app).get(RouteNames.logout).expect(302);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe(RouteNames.basePath);

      expect(Logger.getLogger().error).toHaveBeenCalledWith(
        'Error destroying session:',
        expect.any(Error)
      );
    });

    test('should use SameSite none when NODE_ENV is production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const res = await request(app).get(RouteNames.logout).expect(302);

      expect(res.status).toBe(302);
      expect(res.header['set-cookie'][0]).toContain('SameSite=None');

      process.env.NODE_ENV = originalNodeEnv;
    });

    test('should use SameSite lax when NODE_ENV is not production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const res = await request(app).get(RouteNames.logout).expect(302);

      expect(res.status).toBe(302);
      expect(res.header['set-cookie'][0]).toContain('SameSite=Lax');

      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});
