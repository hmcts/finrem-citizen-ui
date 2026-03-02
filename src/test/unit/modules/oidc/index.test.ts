import config from 'config';
import * as oidcClient from 'openid-client';

import { OIDCModule } from '../../../../main/modules/oidc';
import { OIDCAuthenticationError, OIDCCallbackError } from '../../../../main/modules/oidc/errors';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn(() => mockLogger),
  },
}));

jest.mock('config', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    has: jest.fn(),
  },
}));

jest.mock('openid-client', () => ({
  discovery: jest.fn(),
  buildEndSessionUrl: jest.fn(),
  randomPKCECodeVerifier: jest.fn(),
  calculatePKCECodeChallenge: jest.fn(),
  randomNonce: jest.fn(),
  buildAuthorizationUrl: jest.fn(),
  authorizationCodeGrant: jest.fn(),
  fetchUserInfo: jest.fn(),
}));

describe('OIDCModule', () => {
  const mockConfig = config as jest.Mocked<typeof config>;
  const mockOidc = oidcClient as jest.Mocked<typeof oidcClient>;

  const baseOidcConfig = {
    issuer: 'https://idam-web-public.perftest.platform.hmcts.net',
    clientId: 'finrem-citizen',
    callbackUrl: '/oauth2/callback',
    scope: 'openid profile roles',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.IDAM_SECRET;

    (mockConfig.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'oidc') {
        return baseOidcConfig;
      }
      if (key === 'secrets.finrem.finrem-citizen-oauth2-client-secret') {
        return 'secret-from-config';
      }
      throw new Error(`Unexpected config.get key: ${key}`);
    });

    (mockConfig.has as jest.Mock).mockImplementation((key: string) => {
      return key === 'secrets.finrem.finrem-citizen-oauth2-client-secret';
    });
  });

  const makeReq = (overrides: Partial<any> = {}) => {
    const req: any = {
      headers: {},
      protocol: 'http',
      originalUrl: '/some/path?x=1',
      get: jest.fn((name: string) => (name === 'host' ? 'localhost:3100' : undefined)),
      session: {
        destroy: jest.fn(cb => cb && cb(undefined)),
        save: jest.fn(cb => cb && cb()),
      },
      ...overrides,
    };

    return req;
  };

  const makeRes = () => {
    const res: any = {
      redirect: jest.fn(),
    };
    return res;
  };

  const makeApp = () => {
    const middleware: any[] = [];
    const routes: Record<string, any> = {};

    const app: any = {
      set: jest.fn(),
      use: jest.fn((fn: any) => {
        middleware.push(fn);
      }),
      get: jest.fn((path: string, handler: any) => {
        routes[path] = handler;
      }),
      __middleware: middleware,
      __routes: routes,
    };

    return app;
  };

  it('logs when constructed', () => {
    new OIDCModule();

    expect(mockLogger.info).toHaveBeenCalledWith('OIDCModule instance created');
  });

  it('setupClient returns early if already configured', async () => {
    const module = new OIDCModule();
    (module as any).clientConfig = { already: true };

    await module.setupClient();

    expect(mockOidc.discovery).not.toHaveBeenCalled();
  });

  it('setupClient uses env secret and configures client', async () => {
    process.env.IDAM_SECRET = 'env-secret';

    const discoveredClient = { client: true };
    (mockOidc.discovery as jest.Mock).mockResolvedValue(discoveredClient);

    const module = new OIDCModule();

    await module.setupClient();

    expect(mockLogger.info).toHaveBeenCalledWith('Setting up OIDC client via discovery');
    expect(mockOidc.discovery).toHaveBeenCalledWith(
      new URL(baseOidcConfig.issuer),
      baseOidcConfig.clientId,
      'env-secret'
    );
    expect((module as any).clientConfig).toBe(discoveredClient);
    expect(mockLogger.info).toHaveBeenCalledWith('OIDC client configured successfully');
  });

  it('setupClient falls back to secret from config when env secret is missing', async () => {
    const discoveredClient = { client: true };
    (mockOidc.discovery as jest.Mock).mockResolvedValue(discoveredClient);

    const module = new OIDCModule();

    await module.setupClient();

    expect(mockOidc.discovery).toHaveBeenCalledWith(
      new URL(baseOidcConfig.issuer),
      baseOidcConfig.clientId,
      'secret-from-config'
    );
  });

  it('setupClient logs error when secret is missing', async () => {
    (mockConfig.has as jest.Mock).mockReturnValue(false);
    (mockOidc.discovery as jest.Mock).mockResolvedValue({ client: true });

    const module = new OIDCModule();

    await module.setupClient();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'CRITICAL: IDAM Client Secret is missing or still set to placeholder!'
    );
  });

  it('setupClient logs error when secret is placeholder', async () => {
    process.env.IDAM_SECRET = 'PLACEHOLDER_IDAM_SECRET';
    (mockOidc.discovery as jest.Mock).mockResolvedValue({ client: true });

    const module = new OIDCModule();

    await module.setupClient();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'CRITICAL: IDAM Client Secret is missing or still set to placeholder!'
    );
  });

  it('setupClient logs and rethrows when discovery fails', async () => {
    const discoveryError = new Error('discovery failed');
    (mockOidc.discovery as jest.Mock).mockRejectedValue(discoveryError);

    const module = new OIDCModule();

    await expect(module.setupClient()).rejects.toThrow('discovery failed');

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to setup OIDC client:', discoveryError);
  });

  it('buildRedirectUri returns configured absolute callback URL unchanged', () => {
    (mockConfig.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'oidc') {
        return {
          ...baseOidcConfig,
          callbackUrl: 'https://external.example.com/oauth2/callback',
        };
      }
      if (key === 'secrets.finrem.finrem-citizen-oauth2-client-secret') {
        return 'secret-from-config';
      }
      throw new Error(`Unexpected config.get key: ${key}`);
    });

    const module = new OIDCModule();
    const req = makeReq();

    expect(module.buildRedirectUri(req)).toBe('https://external.example.com/oauth2/callback');
  });

  it('buildRedirectUri uses forwarded headers when callback is relative', () => {
    const module = new OIDCModule();
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.service.justice.gov.uk',
      },
      protocol: 'http',
    });

    expect(module.buildRedirectUri(req)).toBe('https://example.service.justice.gov.uk/oauth2/callback');
  });

  it('buildRedirectUri falls back to req protocol and host', () => {
    const module = new OIDCModule();
    const req = makeReq({
      protocol: 'https',
      get: jest.fn((name: string) => (name === 'host' ? 'local.test:9999' : undefined)),
    });

    expect(module.buildRedirectUri(req)).toBe('https://local.test:9999/oauth2/callback');
  });

  it('getCurrentUrl uses forwarded headers', () => {
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'forwarded.example.com',
      },
      originalUrl: '/oauth2/callback?code=abc',
    });

    const url = OIDCModule.getCurrentUrl(req as any);

    expect(url.href).toBe('https://forwarded.example.com/oauth2/callback?code=abc');
  });

  it('getCurrentUrl falls back to req protocol and default host', () => {
    const req = makeReq({
      headers: {},
      protocol: 'http',
      originalUrl: '/hello',
      get: jest.fn(() => undefined),
    });

    const url = OIDCModule.getCurrentUrl(req as any);

    expect(url.href).toBe('http://localhost:3100/hello');
  });

  it('enableFor sets trust proxy, adds setup middleware and routes', () => {
    const app = makeApp();
    const module = new OIDCModule();

    module.enableFor(app);

    expect(app.set).toHaveBeenCalledWith('trust proxy', true);
    expect(app.use).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('/logout', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/login', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/oauth2/callback', expect.any(Function));
  });

  it('setup middleware calls setupClient when client config is missing', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    const setupSpy = jest.spyOn(module, 'setupClient').mockResolvedValue();

    module.enableFor(app);

    const middleware = app.__middleware[0];
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(setupSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('setup middleware skips setupClient when already configured', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    (module as any).clientConfig = { configured: true };
    const setupSpy = jest.spyOn(module, 'setupClient');

    module.enableFor(app);

    const middleware = app.__middleware[0];
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(setupSpy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('setup middleware passes error to next when setupClient fails', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    const error = new Error('setup failed');
    jest.spyOn(module, 'setupClient').mockRejectedValue(error);

    module.enableFor(app);

    const middleware = app.__middleware[0];
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('logout destroys session and redirects home if client config is missing', () => {
    const app = makeApp();
    const module = new OIDCModule();

    module.enableFor(app);

    const handler = app.__routes['/logout'];
    const req = makeReq();
    const res = makeRes();

    handler(req, res);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  it('logout builds end-session URL with id_token_hint and redirects to it', () => {
    const app = makeApp();
    const module = new OIDCModule();
    const clientConfig = { client: true };
    (module as any).clientConfig = clientConfig;

    (mockOidc.buildEndSessionUrl as jest.Mock).mockReturnValue(new URL('https://issuer.example/logout'));

    module.enableFor(app);

    const handler = app.__routes['/logout'];
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'app.example.com',
      },
      originalUrl: '/logout',
      session: {
        user: {
          idToken: 'id-token-123',
        },
        destroy: jest.fn(cb => cb && cb(undefined)),
      },
    });
    const res = makeRes();

    handler(req, res);

    expect(mockOidc.buildEndSessionUrl).toHaveBeenCalledWith(clientConfig, {
      post_logout_redirect_uri: 'https://app.example.com',
      id_token_hint: 'id-token-123',
    });
    expect(res.redirect).toHaveBeenCalledWith('https://issuer.example/logout');
  });

  it('logout logs destroy error but still redirects', () => {
    const app = makeApp();
    const module = new OIDCModule();
    const clientConfig = { client: true };
    (module as any).clientConfig = clientConfig;

    (mockOidc.buildEndSessionUrl as jest.Mock).mockReturnValue(new URL('https://issuer.example/logout'));

    module.enableFor(app);

    const handler = app.__routes['/logout'];
    const destroyError = new Error('destroy failed');
    const req = makeReq({
      session: {
        user: {},
        destroy: jest.fn(cb => cb && cb(destroyError)),
      },
    });
    const res = makeRes();

    handler(req, res);

    expect(mockLogger.error).toHaveBeenCalledWith('Session destroy error on logout:', destroyError);
    expect(res.redirect).toHaveBeenCalledWith('https://issuer.example/logout');
  });

  it('login creates PKCE login redirect when server supports PKCE', async () => {
    const app = makeApp();
    const module = new OIDCModule();

    const clientConfig = {
      serverMetadata: jest.fn(() => ({
        supportsPKCE: jest.fn(() => true),
      })),
    };
    (module as any).clientConfig = clientConfig;

    (mockOidc.randomPKCECodeVerifier as jest.Mock).mockReturnValue('verifier-123');
    (mockOidc.calculatePKCECodeChallenge as jest.Mock).mockResolvedValue('challenge-123');
    (mockOidc.buildAuthorizationUrl as jest.Mock).mockReturnValue(new URL('https://issuer.example/auth'));

    module.enableFor(app);

    const handler = app.__routes['/login'];
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'app.example.com',
      },
      session: {},
    });
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(req.session.codeVerifier).toBe('verifier-123');
    expect(req.session.nonce).toBeUndefined();
    expect(mockOidc.buildAuthorizationUrl).toHaveBeenCalledWith(clientConfig, {
      code_challenge: 'challenge-123',
      code_challenge_method: 'S256',
      redirect_uri: 'https://app.example.com/oauth2/callback',
      scope: baseOidcConfig.scope,
    });
    expect(res.redirect).toHaveBeenCalledWith('https://issuer.example/auth');
    expect(next).not.toHaveBeenCalled();
  });

  it('login adds nonce when PKCE is not supported', async () => {
    const app = makeApp();
    const module = new OIDCModule();

    const clientConfig = {
      serverMetadata: jest.fn(() => ({
        supportsPKCE: jest.fn(() => false),
      })),
    };
    (module as any).clientConfig = clientConfig;

    (mockOidc.randomPKCECodeVerifier as jest.Mock).mockReturnValue('verifier-456');
    (mockOidc.calculatePKCECodeChallenge as jest.Mock).mockResolvedValue('challenge-456');
    (mockOidc.randomNonce as jest.Mock).mockReturnValue('nonce-456');
    (mockOidc.buildAuthorizationUrl as jest.Mock).mockReturnValue(new URL('https://issuer.example/auth2'));

    module.enableFor(app);

    const handler = app.__routes['/login'];
    const req = makeReq({
      session: {},
    });
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(req.session.nonce).toBe('nonce-456');
    expect(mockOidc.buildAuthorizationUrl).toHaveBeenCalledWith(clientConfig, {
      code_challenge: 'challenge-456',
      code_challenge_method: 'S256',
      redirect_uri: 'http://localhost:3100/oauth2/callback',
      scope: baseOidcConfig.scope,
      nonce: 'nonce-456',
    });
    expect(res.redirect).toHaveBeenCalledWith('https://issuer.example/auth2');
  });

  it('login converts error into OIDCAuthenticationError', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    (module as any).clientConfig = {
      serverMetadata: jest.fn(() => ({
        supportsPKCE: jest.fn(() => true),
      })),
    };

    (mockOidc.randomPKCECodeVerifier as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    module.enableFor(app);

    const handler = app.__routes['/login'];
    const req = makeReq({ session: {} });
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith('Login error:', expect.any(Error));
    expect(next).toHaveBeenCalledWith(expect.any(OIDCAuthenticationError));
    expect((next.mock.calls[0][0] as Error).message).toBe('Failed to initiate login');
  });

  it('oauth2 callback stores user in session, clears temp values and redirects to returnTo', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    const clientConfig = { client: true };
    (module as any).clientConfig = clientConfig;

    const claims = { sub: 'user-123' };
    const tokens = {
      access_token: 'access-123',
      id_token: 'id-123',
      refresh_token: 'refresh-123',
      claims: jest.fn(() => claims),
    };

    (mockOidc.authorizationCodeGrant as jest.Mock).mockResolvedValue(tokens);
    (mockOidc.fetchUserInfo as jest.Mock).mockResolvedValue({
      sub: 'user-123',
      given_name: 'Lexi',
    });

    module.enableFor(app);

    const handler = app.__routes['/oauth2/callback'];
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'app.example.com',
      },
      originalUrl: '/oauth2/callback?code=abc',
      session: {
        codeVerifier: 'verifier-123',
        nonce: 'nonce-123',
        returnTo: '/dashboard',
        save: jest.fn(cb => cb && cb()),
      },
    });
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(mockOidc.authorizationCodeGrant).toHaveBeenCalledWith(
      clientConfig,
      new URL('https://app.example.com/oauth2/callback?code=abc'),
      {
        expectedNonce: 'nonce-123',
        idTokenExpected: true,
        pkceCodeVerifier: 'verifier-123',
      }
    );

    expect(mockOidc.fetchUserInfo).toHaveBeenCalledWith(clientConfig, 'access-123', 'user-123');

    expect(req.session.user).toEqual({
      sub: 'user-123',
      given_name: 'Lexi',
      accessToken: 'access-123',
      idToken: 'id-123',
      refreshToken: 'refresh-123',
    });

    expect(req.session.codeVerifier).toBeUndefined();
    expect(req.session.nonce).toBeUndefined();
    expect(req.session.returnTo).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    expect(next).not.toHaveBeenCalled();
  });

  it('oauth2 callback defaults redirect to / when returnTo is missing', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    const clientConfig = { client: true };
    (module as any).clientConfig = clientConfig;

    const tokens = {
      access_token: 'access-123',
      id_token: 'id-123',
      refresh_token: 'refresh-123',
      claims: jest.fn(() => ({ sub: 'user-123' })),
    };

    (mockOidc.authorizationCodeGrant as jest.Mock).mockResolvedValue(tokens);
    (mockOidc.fetchUserInfo as jest.Mock).mockResolvedValue({
      sub: 'user-123',
    });

    module.enableFor(app);

    const handler = app.__routes['/oauth2/callback'];
    const req = makeReq({
      originalUrl: '/oauth2/callback?code=abc',
      session: {
        codeVerifier: 'verifier',
        nonce: 'nonce',
        save: jest.fn(cb => cb && cb()),
      },
    });
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  it('oauth2 callback passes through OIDCCallbackError if no id token is returned', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    (module as any).clientConfig = { client: true };

    const tokens = {
      access_token: 'access-123',
      id_token: undefined,
      refresh_token: 'refresh-123',
      claims: jest.fn(() => ({ sub: 'user-123' })),
    };

    (mockOidc.authorizationCodeGrant as jest.Mock).mockResolvedValue(tokens);

    module.enableFor(app);

    const handler = app.__routes['/oauth2/callback'];
    const req = makeReq({
      session: {
        codeVerifier: 'verifier',
        nonce: 'nonce',
      },
    });
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith('OIDC callback error:', expect.any(OIDCCallbackError));
    expect(next).toHaveBeenCalledWith(expect.any(OIDCCallbackError));
    expect((next.mock.calls[0][0] as Error).message).toBe('No ID token received from IDAM');
  });

  it('oauth2 callback wraps unexpected errors in OIDCCallbackError', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    (module as any).clientConfig = { client: true };

    const unexpectedError = new Error('unexpected');
    (mockOidc.authorizationCodeGrant as jest.Mock).mockRejectedValue(unexpectedError);

    module.enableFor(app);

    const handler = app.__routes['/oauth2/callback'];
    const req = makeReq({
      session: {
        codeVerifier: 'verifier',
        nonce: 'nonce',
      },
    });
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith('OIDC callback error:', unexpectedError);
    expect(next).toHaveBeenCalledWith(expect.any(OIDCCallbackError));
    expect((next.mock.calls[0][0] as Error).message).toBe('Authentication callback failed');
  });
});
