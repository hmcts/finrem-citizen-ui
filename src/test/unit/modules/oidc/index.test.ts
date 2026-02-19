import express from 'express';
import * as oidcClient from 'openid-client';
import supertest from 'supertest';

import { OIDCCallbackError } from '../../../../main/modules/oidc/errors';
import { OIDCModule, getSubFromIdToken } from '../../../../main/modules/oidc/index';

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
  },
}));

jest.mock('config', () => ({
  get: jest.fn((key: string) => {
    const map: Record<string, unknown> = {
      oidc: {
        issuer: 'https://idam.example.com/o',
        clientId: 'test-client',
        callbackUrl: 'http://localhost:3100/oauth2/callback',
        scope: 'openid profile roles',
      },
      'secrets.finrem.idam-secret': 'test-secret',
    };
    return map[key];
  }),
}));

jest.mock('openid-client', () => ({
  discovery: jest.fn(),
  randomPKCECodeVerifier: jest.fn(),
  calculatePKCECodeChallenge: jest.fn(),
  buildAuthorizationUrl: jest.fn(),
  randomNonce: jest.fn(),
  authorizationCodeGrant: jest.fn(),
  fetchUserInfo: jest.fn(),
  buildEndSessionUrl: jest.fn(),
}));

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

function createSession(data: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...data,
    save: jest.fn((cb: (err: null) => void) => cb(null)),
    destroy: jest.fn((cb: (err: null) => void) => {
      Object.keys(data).forEach(k => delete data[k]);
      cb(null);
    }),
    regenerate: jest.fn(),
    reload: jest.fn(),
    resetMaxAge: jest.fn(),
    touch: jest.fn(),
    id: 'test-session-id',
    cookie: {},
  };
}

function buildTestApp(mod: OIDCModule, sessionData: Record<string, unknown> = {}): express.Express {
  const shared = sessionData;
  const app = express();
  app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const sess = createSession(shared);
    (req as unknown as Record<string, unknown>)['session'] = sess;
    next();
  });
  mod.enableFor(app);
  return app;
}

const mockClientConfig = {
  serverMetadata: () => ({ supportsPKCE: () => true }),
};

const mockClientConfigNoPKCE = {
  serverMetadata: () => ({ supportsPKCE: () => false }),
};

describe('getSubFromIdToken', () => {
  it('returns sub from a valid JWT payload', () => {
    const token = makeJwt({ sub: 'user-123' });
    expect(getSubFromIdToken(token)).toBe('user-123');
  });

  it('throws when token has fewer than 2 parts', () => {
    expect(() => getSubFromIdToken('onlyone')).toThrow('Invalid ID token format');
  });

  it('throws when payload decodes to a non-object string', () => {
    const header = Buffer.from('{}').toString('base64url');
    const notObj = Buffer.from('"just-a-string"').toString('base64url');
    expect(() => getSubFromIdToken(`${header}.${notObj}.sig`)).toThrow('Invalid ID token payload');
  });

  it('throws when payload decodes to a JSON array', () => {
    const header = Buffer.from('{}').toString('base64url');
    const arr = Buffer.from('[]').toString('base64url');
    expect(() => getSubFromIdToken(`${header}.${arr}.sig`)).toThrow('Invalid ID token payload');
  });

  it('throws when sub is missing from payload', () => {
    const token = makeJwt({ email: 'a@b.com' });
    expect(() => getSubFromIdToken(token)).toThrow('Missing sub claim in ID token');
  });

  it('throws when sub is an empty string', () => {
    const token = makeJwt({ sub: '' });
    expect(() => getSubFromIdToken(token)).toThrow('Missing sub claim in ID token');
  });
});

describe('OIDCModule.getCurrentUrl', () => {
  function makeReq(overrides: Record<string, unknown>): express.Request {
    return {
      headers: {},
      protocol: 'http',
      get: () => 'localhost:3100',
      originalUrl: '/test',
      ...overrides,
    } as unknown as express.Request;
  }

  it('uses x-forwarded-proto and x-forwarded-host when present', () => {
    const req = makeReq({ headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'example.com' } });
    const url = OIDCModule.getCurrentUrl(req);
    expect(url.href).toBe('https://example.com/test');
  });

  it('falls back to req.protocol and host when forwarded headers are absent', () => {
    const req = makeReq({ headers: {} });
    expect(OIDCModule.getCurrentUrl(req).href).toBe('http://localhost:3100/test');
  });

  it('uses default host when req.get returns undefined', () => {
    const req = makeReq({ headers: {}, get: () => undefined });
    expect(OIDCModule.getCurrentUrl(req).host).toBe('localhost:3100');
  });
});

describe('OIDCModule.buildRedirectUri', () => {
  it('returns absolute callbackUrl as-is', () => {
    (oidcClient.discovery as jest.Mock).mockResolvedValue(mockClientConfig);
    const mod = new OIDCModule();
    const req = {
      headers: {},
      protocol: 'http',
      get: () => 'localhost:3100',
    } as unknown as express.Request;
    expect(mod.buildRedirectUri(req)).toBe('http://localhost:3100/oauth2/callback');
  });

  it('constructs absolute URI when callbackUrl is relative', () => {
    const configMock = jest.requireMock('config') as { get: jest.Mock };
    configMock.get.mockImplementation((key: string) => {
      if (key === 'oidc') {
        return {
          issuer: 'https://idam.example.com/o',
          clientId: 'test-client',
          callbackUrl: '/oauth2/callback',
          scope: 'openid profile roles',
        };
      }
      if (key === 'secrets.finrem.idam-secret') {
        return 'test-secret';
      }
      return undefined;
    });

    (oidcClient.discovery as jest.Mock).mockResolvedValue(mockClientConfig);
    const mod = new OIDCModule();
    const req = {
      headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'app.example.com' },
      protocol: 'http',
      get: () => 'localhost:3100',
    } as unknown as express.Request;
    expect(mod.buildRedirectUri(req)).toBe('https://app.example.com/oauth2/callback');

    configMock.get.mockImplementation((key: string) => {
      const map: Record<string, unknown> = {
        oidc: {
          issuer: 'https://idam.example.com/o',
          clientId: 'test-client',
          callbackUrl: 'http://localhost:3100/oauth2/callback',
          scope: 'openid profile roles',
        },
        'secrets.finrem.idam-secret': 'test-secret',
      };
      return map[key];
    });
  });
});

describe('OIDCModule routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (oidcClient.discovery as jest.Mock).mockResolvedValue(mockClientConfig);
    (oidcClient.randomPKCECodeVerifier as jest.Mock).mockReturnValue('test-verifier');
    (oidcClient.calculatePKCECodeChallenge as jest.Mock).mockResolvedValue('test-challenge');
    (oidcClient.buildAuthorizationUrl as jest.Mock).mockReturnValue({ href: 'https://idam.example.com/auth' });
    (oidcClient.randomNonce as jest.Mock).mockReturnValue('test-nonce');
  });

  describe('GET /login', () => {
    it('redirects to IDAM auth URL with PKCE', async () => {
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);

      const res = await supertest(app).get('/login');
      expect(res.status).toBe(302);
      expect(res.header['location']).toBe('https://idam.example.com/auth');
    });

    it('adds nonce when server does not support PKCE', async () => {
      (oidcClient.discovery as jest.Mock).mockResolvedValue(mockClientConfigNoPKCE);
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);

      await supertest(app).get('/login');
      expect(oidcClient.randomNonce).toHaveBeenCalled();
    });

    it('forwards error to next when buildAuthorizationUrl throws', async () => {
      (oidcClient.buildAuthorizationUrl as jest.Mock).mockImplementation(() => {
        throw new Error('auth url error');
      });
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);
      app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ message: err.message });
      });

      const res = await supertest(app).get('/login');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /oauth2/callback', () => {
    const mockUserInfo = { sub: 'user-123', email: 'user@example.com' };
    const validIdToken = makeJwt({ sub: 'user-123' });

    beforeEach(() => {
      (oidcClient.authorizationCodeGrant as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        id_token: validIdToken,
        refresh_token: 'refresh-token',
      });
      (oidcClient.fetchUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
    });

    it('exchanges code and redirects to / by default', async () => {
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);

      const res = await supertest(app).get('/oauth2/callback?code=abc&state=xyz');
      expect(res.status).toBe(302);
      expect(res.header['location']).toBe('/');
    });

    it('redirects to returnTo when pre-set in session', async () => {
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod, { returnTo: '/my-page' });

      const res = await supertest(app).get('/oauth2/callback?code=abc');
      expect(res.header['location']).toBe('/my-page');
    });

    it('passes OIDCCallbackError to next when id_token is missing', async () => {
      (oidcClient.authorizationCodeGrant as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        id_token: undefined,
        refresh_token: undefined,
      });
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);
      app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ message: err.message });
      });

      const res = await supertest(app).get('/oauth2/callback?code=abc');
      expect(res.body.message).toBe('No ID token received from IDAM');
    });

    it('wraps non-OIDCCallbackError in OIDCCallbackError', async () => {
      (oidcClient.authorizationCodeGrant as jest.Mock).mockRejectedValue(new Error('token exchange failed'));
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);
      app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ message: err.message });
      });

      const res = await supertest(app).get('/oauth2/callback?code=abc');
      expect(res.body.message).toBe('Authentication callback failed');
    });

    it('preserves OIDCCallbackError thrown directly', async () => {
      (oidcClient.authorizationCodeGrant as jest.Mock).mockRejectedValue(
        new OIDCCallbackError('direct callback error')
      );
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);
      app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ message: err.message });
      });

      const res = await supertest(app).get('/oauth2/callback?code=abc');
      expect(res.body.message).toBe('direct callback error');
    });

    it('passes error when sub extraction fails', async () => {
      (oidcClient.authorizationCodeGrant as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        id_token: 'bad.token',
        refresh_token: undefined,
      });
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);
      app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ message: err.message });
      });

      const res = await supertest(app).get('/oauth2/callback?code=abc');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /logout', () => {
    it('destroys session and redirects to IDAM logout URL', async () => {
      (oidcClient.buildEndSessionUrl as jest.Mock).mockReturnValue({ href: 'https://idam.example.com/logout' });
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);

      const res = await supertest(app).get('/logout');
      expect(res.status).toBe(302);
      expect(res.header['location']).toBe('https://idam.example.com/logout');
    });

    it('includes id_token_hint when session has user with idToken', async () => {
      (oidcClient.buildEndSessionUrl as jest.Mock).mockReturnValue({ href: 'https://idam.example.com/logout' });
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod, {
        user: { accessToken: 'at', idToken: 'my-id-token', sub: 'u', refreshToken: undefined },
      });

      await supertest(app).get('/logout');

      const callArgs = (oidcClient.buildEndSessionUrl as jest.Mock).mock.calls[0];
      const params = callArgs[1] as Record<string, string>;
      expect(params['id_token_hint']).toBe('my-id-token');
    });

    it('redirects to / when clientConfig is not ready', async () => {
      (oidcClient.discovery as jest.Mock).mockRejectedValue(new Error('discovery failed'));
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));
      const app = buildTestApp(mod);

      (mod as unknown as Record<string, unknown>)['clientConfig'] = undefined;

      const res = await supertest(app).get('/logout');
      expect(res.status).toBe(302);
      expect(res.header['location']).toBe('/');
    });

    it('logs error but still redirects when session.destroy fails', async () => {
      (oidcClient.buildEndSessionUrl as jest.Mock).mockReturnValue({ href: 'https://idam.example.com/logout' });
      const mod = new OIDCModule();
      await new Promise(r => setTimeout(r, 10));

      const app = express();
      app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
        (req as unknown as Record<string, unknown>)['session'] = {
          save: jest.fn((cb: (err: null) => void) => cb(null)),
          destroy: jest.fn((cb: (err: Error) => void) => cb(new Error('destroy failed'))),
          regenerate: jest.fn(),
          reload: jest.fn(),
          resetMaxAge: jest.fn(),
          touch: jest.fn(),
          id: 'test-session-id',
          cookie: {},
        };
        next();
      });
      mod.enableFor(app);

      const res = await supertest(app).get('/logout');
      expect(res.status).toBe(302);
      expect(res.header['location']).toBe('https://idam.example.com/logout');
    });
  });

  describe('guard middleware', () => {
    it('calls setupClient and continues when clientConfig is not yet ready', async () => {
      (oidcClient.discovery as jest.Mock).mockResolvedValue(mockClientConfig);
      const mod = new OIDCModule();
      const app = buildTestApp(mod);

      const res = await supertest(app).get('/login');
      expect(res.status).toBe(302);
    });

    it('passes error to next when setupClient fails on request', async () => {
      (oidcClient.discovery as jest.Mock).mockRejectedValue(new Error('discovery error'));
      const mod = new OIDCModule();
      const app = buildTestApp(mod);
      app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ message: err.message });
      });

      (mod as unknown as Record<string, unknown>)['clientConfig'] = undefined;

      const res = await supertest(app).get('/login');
      expect(res.status).toBe(500);
    });
  });
});
