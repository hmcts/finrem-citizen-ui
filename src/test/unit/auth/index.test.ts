import { NextFunction, Request, Response } from 'express';

import { getFinremMiddleware, successCallback } from '../../../main/auth';

jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn(),
}));

interface MockSession {
  passport: {
    user: {
      tokenset: { accessToken: string };
      userinfo: {
        sub?: string;
        email?: string;
        roles: string[];
        uid?: string;
        id?: string;
      };
    };
  };
  auth?: {
    email: string;
    roles: string[];
    token: string;
    userId: string;
  };
}

interface MockRequest {
  session: MockSession;
  isRefresh?: boolean;
}

interface NodeLibOptions {
  auth: {
    oidc?: Record<string, unknown>;
    s2s?: Record<string, unknown>;
  };
  session: Record<string, unknown>;
}

describe('auth/index', () => {
  describe('successCallback', () => {
    let req: MockRequest;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        session: {
          passport: {
            user: {
              tokenset: { accessToken: 'test-access-token' },
              userinfo: {
                sub: 'user@example.com',
                roles: ['citizen'],
                uid: 'user-123',
              },
            },
          },
        },
      };
      res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      };
      next = jest.fn();
    });

    it('should set cookie and redirect to / when not a refresh', async () => {
      await successCallback(req as unknown as Request, res as Response, next);

      expect(res.cookie).toHaveBeenCalledWith(
        '__auth__',
        'test-access-token',
        expect.objectContaining({
          sameSite: 'lax',
          httpOnly: true,
        })
      );
      expect(res.redirect).toHaveBeenCalledWith('/');
      expect(next).not.toHaveBeenCalled();
    });

    it('should store user info in session when session.auth does not exist', async () => {
      await successCallback(req as unknown as Request, res as Response, next);

      expect(req.session.auth).toEqual({
        email: 'user@example.com',
        roles: ['citizen'],
        token: 'test-access-token',
        userId: 'user-123',
      });
    });

    it('should not overwrite session.auth if it already exists', async () => {
      const existingAuth = { email: 'existing@example.com', roles: ['admin'], token: 'old-token', userId: 'old-id' };
      req.session.auth = existingAuth;

      await successCallback(req as unknown as Request, res as Response, next);

      expect(req.session.auth).toBe(existingAuth);
    });

    it('should use email field when sub is not available', async () => {
      req.session.passport.user.userinfo = {
        email: 'fallback@example.com',
        roles: ['citizen'],
        id: 'user-456',
      };

      await successCallback(req as unknown as Request, res as Response, next);

      expect(req.session.auth?.email).toBe('fallback@example.com');
      expect(req.session.auth?.userId).toBe('user-456');
    });

    it('should call next instead of redirect when isRefresh is true', async () => {
      req.isRefresh = true;

      await successCallback(req as unknown as Request, res as Response, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getFinremMiddleware', () => {
    it('should return a middleware function', () => {
      const middleware = getFinremMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should call xuiNode.configure with oidc auth options', () => {
      const { xuiNode } = require('@hmcts/rpx-xui-node-lib');
      const configureSpy = jest.spyOn(xuiNode, 'configure');

      getFinremMiddleware();

      expect(configureSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: expect.objectContaining({
            oidc: expect.objectContaining({
              clientID: 'finrem-citizen-ui',
              sessionKey: 'finrem-citizen-ui',
              responseTypes: ['code'],
              scope: 'profile openid roles',
              useRoutes: true,
            }),
          }),
          session: expect.any(Object),
        })
      );

      configureSpy.mockRestore();
    });

    it('should use file store when redis is disabled', () => {
      const { xuiNode } = require('@hmcts/rpx-xui-node-lib');
      const configureSpy = jest.spyOn(xuiNode, 'configure');

      getFinremMiddleware();

      const callArgs = configureSpy.mock.calls[0][0] as NodeLibOptions;
      expect(callArgs.session).toHaveProperty('fileStore');

      configureSpy.mockRestore();
    });

    it('should use oidc type for authentication', () => {
      const { xuiNode } = require('@hmcts/rpx-xui-node-lib');
      const configureSpy = jest.spyOn(xuiNode, 'configure');

      getFinremMiddleware();

      const callArgs = configureSpy.mock.calls[0][0] as NodeLibOptions;
      expect(callArgs.auth).toHaveProperty('oidc');
      expect(callArgs.auth).not.toHaveProperty('s2s');

      configureSpy.mockRestore();
    });

    it('should use redis store when redis is enabled', () => {
      const config = require('config');
      const originalGet = config.get.bind(config);
      jest.spyOn(config, 'get').mockImplementation((...args: unknown[]) => {
        if (args[0] === 'feature.redisEnabled') {
          return true;
        }
        return originalGet(args[0]);
      });

      const { xuiNode } = require('@hmcts/rpx-xui-node-lib');
      const configureSpy = jest.spyOn(xuiNode, 'configure');

      getFinremMiddleware();

      const callArgs = configureSpy.mock.calls[0][0] as NodeLibOptions;
      expect(callArgs.session).toHaveProperty('redisStore');

      configureSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should use /tmp/sessions file path when NOW config is truthy', () => {
      const config = require('config');
      const originalGet = config.get.bind(config);
      jest.spyOn(config, 'get').mockImplementation((...args: unknown[]) => {
        if (args[0] === 'now') {
          return true;
        }
        return originalGet(args[0]);
      });

      const { xuiNode } = require('@hmcts/rpx-xui-node-lib');
      const configureSpy = jest.spyOn(xuiNode, 'configure');

      getFinremMiddleware();

      const callArgs = configureSpy.mock.calls[0][0] as NodeLibOptions;
      const fileStore = callArgs.session as Record<string, Record<string, Record<string, string>>>;
      expect(fileStore.fileStore.fileStoreOptions.filePath).toBe('/tmp/sessions');

      configureSpy.mockRestore();
      jest.restoreAllMocks();
    });
  });
});
