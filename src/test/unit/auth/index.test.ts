import { NextFunction, Request, Response } from 'express';

import { getFinremMiddleware, successCallback } from '../../../main/auth';

jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn(),
}));

describe('auth/index', () => {
  describe('successCallback', () => {
    let req: Partial<Request>;
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
        } as any,
      } as any;
      res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      };
      next = jest.fn();
    });

    it('should set cookie and redirect to / when not a refresh', async () => {
      await successCallback(req as Request, res as Response, next);

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
      await successCallback(req as Request, res as Response, next);

      expect((req.session as any).auth).toEqual({
        email: 'user@example.com',
        roles: ['citizen'],
        token: 'test-access-token',
        userId: 'user-123',
      });
    });

    it('should not overwrite session.auth if it already exists', async () => {
      const existingAuth = { email: 'existing@example.com', roles: ['admin'], token: 'old-token', userId: 'old-id' };
      (req.session as any).auth = existingAuth;

      await successCallback(req as Request, res as Response, next);

      expect((req.session as any).auth).toBe(existingAuth);
    });

    it('should use email field when sub is not available', async () => {
      (req.session as any).passport.user.userinfo = {
        email: 'fallback@example.com',
        roles: ['citizen'],
        id: 'user-456',
      };

      await successCallback(req as Request, res as Response, next);

      expect((req.session as any).auth.email).toBe('fallback@example.com');
      expect((req.session as any).auth.userId).toBe('user-456');
    });

    it('should call next instead of redirect when isRefresh is true', async () => {
      (req as any).isRefresh = true;

      await successCallback(req as Request, res as Response, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getFinremMiddleware', () => {
    it('should return a middleware function', () => {
      const middleware = getFinremMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should call xuiNode.configure with auth options', () => {
      const { xuiNode } = require('@hmcts/rpx-xui-node-lib');
      const configureSpy = jest.spyOn(xuiNode, 'configure');

      getFinremMiddleware();

      expect(configureSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: expect.objectContaining({
            s2s: expect.objectContaining({
              microservice: 'finrem_citizen_ui',
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

      const callArgs = configureSpy.mock.calls[0][0] as any;
      expect(callArgs.session).toHaveProperty('fileStore');

      configureSpy.mockRestore();
    });

    it('should use oauth2 type when OIDC is disabled', () => {
      const { xuiNode } = require('@hmcts/rpx-xui-node-lib');
      const configureSpy = jest.spyOn(xuiNode, 'configure');

      getFinremMiddleware();

      const callArgs = configureSpy.mock.calls[0][0] as any;
      expect(callArgs.auth).toHaveProperty('oauth2');

      configureSpy.mockRestore();
    });
  });
});
