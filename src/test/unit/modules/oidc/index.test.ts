import config from 'config';
import type { Express, NextFunction, Request, Response } from 'express';
import * as oidcClient from 'openid-client';

import { OIDCAuthenticationError, OIDCCallbackError } from '../../../../main/modules/oidc/errors';
import { OIDCModule } from '../../../../main/modules/oidc/index';

const mockLogger = {
  info: jest.fn<void, [string]>(),
  error: jest.fn<void, [string, unknown?]>(),
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

type SessionUser = {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  sub?: string;
  given_name?: string;
};

type SessionLike = {
  codeVerifier?: string;
  nonce?: string;
  returnTo?: string;
  user?: SessionUser;
  destroy: (callback: (err?: unknown) => void) => void;
  save: (callback: () => void) => void;
};

type RequestLike = {
  headers: Request['headers'];
  protocol: string;
  originalUrl: string;
  get: (name: string) => string | undefined;
  session: SessionLike;
};

type ResponseLike = {
  redirect: jest.Mock<void, [string]>;
};

type RouteHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
type SetupMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

type TestApp = Pick<Express, 'set' | 'use' | 'get'> & {
  __middleware: SetupMiddleware[];
  __routes: Record<string, RouteHandler>;
};

type ConfigModule = {
  get: <T>(key: string) => T;
  has: (key: string) => boolean;
};

describe('OIDCModule', () => {
  const mockedConfig = config as unknown as jest.Mocked<ConfigModule>;
  const mockedOidc = oidcClient as jest.Mocked<typeof oidcClient>;

  const baseOidcConfig = {
    issuer: 'https://idam-web-public.perftest.platform.hmcts.net',
    clientId: 'finrem-citizen',
    callbackUrl: '/oauth2/callback',
    scope: 'openid profile roles',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET;
    delete process.env.IDAM_SECRET;

    mockedConfig.get.mockImplementation(<T>(key: string): T => {
      if (key === 'oidc') {
        return baseOidcConfig as T;
      }
      if (key === 'secrets.finrem.finrem-citizen-ui-idam-client-secret') {
        return 'secret-from-config' as T;
      }
      throw new Error(`Unexpected config.get key: ${key}`);
    });

    mockedConfig.has.mockImplementation((key: string): boolean => {
      return key === 'secrets.finrem.finrem-citizen-ui-idam-client-secret';
    });
  });

  const makeReq = (overrides: Partial<RequestLike> = {}): Request => {
    const base: RequestLike = {
      headers: {},
      protocol: 'http',
      originalUrl: '/some/path?x=1',
      get: (name: string): string | undefined => (name === 'host' ? 'localhost:3100' : undefined),
      session: {
        destroy: (callback: (err?: unknown) => void): void => callback(),
        save: (callback: () => void): void => callback(),
      },
    };

    return { ...base, ...overrides } as unknown as Request;
  };

  const makeRes = (): Response => {
    const response: ResponseLike = {
      redirect: jest.fn<void, [string]>(),
    };

    return response as unknown as Response;
  };

  const makeApp = (): TestApp => {
    const middleware: SetupMiddleware[] = [];
    const routes: Record<string, RouteHandler> = {};

    const setMock = jest.fn<void, [string, boolean]>();
    const useMock = jest.fn<void, [SetupMiddleware]>();
    const getMock = jest.fn<void, [string, RouteHandler]>();

    const app: TestApp = {
      set: setMock as unknown as Express['set'],
      use: useMock as unknown as Express['use'],
      get: getMock as unknown as Express['get'],
      __middleware: middleware,
      __routes: routes,
    };

    useMock.mockImplementation((fn: SetupMiddleware): void => {
      middleware.push(fn);
    });

    getMock.mockImplementation((path: string, handler: RouteHandler): void => {
      routes[path] = handler;
    });

    return app;
  };

  const setClientConfig = (module: OIDCModule, value: oidcClient.Configuration | undefined): void => {
    Reflect.set(module as object, 'clientConfig', value);
  };

  const getClientConfig = (module: OIDCModule): unknown => {
    return Reflect.get(module as object, 'clientConfig');
  };

  it('logs when constructed', () => {
    new OIDCModule();

    expect(mockLogger.info).toHaveBeenCalledWith('OIDCModule instance created');
  });

  it('setupClient returns early if already configured', async () => {
    const module = new OIDCModule();

    setClientConfig(module, {} as unknown as oidcClient.Configuration);

    await module.setupClient();

    expect(mockedOidc.discovery).not.toHaveBeenCalled();
  });

  it('setupClient uses env secret and configures client', async () => {
    // If the app checks FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET or IDAM_SECRET, we set both to be safe
    process.env.FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET = 'finrem-citizen-ui-idam-client-secret';
    process.env.IDAM_SECRET = 'finrem-citizen-ui-idam-client-secret';

    const discoveredClient = {} as unknown as oidcClient.Configuration;
    mockedOidc.discovery.mockResolvedValue(discoveredClient);

    const module = new OIDCModule();

    await module.setupClient();

    expect(mockLogger.info).toHaveBeenCalledWith('Setting up OIDC client via discovery');
    expect(mockedOidc.discovery).toHaveBeenCalledWith(
      new URL(baseOidcConfig.issuer),
      baseOidcConfig.clientId,
      'finrem-citizen-ui-idam-client-secret'
    );
    expect(getClientConfig(module)).toBe(discoveredClient);
    expect(mockLogger.info).toHaveBeenCalledWith('OIDC client configured successfully');
  });

  it('setupClient falls back to config secret when env secret is missing', async () => {
    const discoveredClient = {} as unknown as oidcClient.Configuration;
    mockedOidc.discovery.mockResolvedValue(discoveredClient);

    const module = new OIDCModule();

    await module.setupClient();

    expect(mockedOidc.discovery).toHaveBeenCalledWith(
      new URL(baseOidcConfig.issuer),
      baseOidcConfig.clientId,
      'secret-from-config'
    );
  });

  it('setupClient logs when secret is missing', async () => {
    mockedConfig.has.mockReturnValue(false);
    mockedOidc.discovery.mockResolvedValue({} as unknown as oidcClient.Configuration);

    const module = new OIDCModule();

    await module.setupClient();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'CRITICAL: IDAM Client Secret is missing or still set to placeholder!'
    );
  });

  it('setupClient logs and rethrows discovery errors', async () => {
    const discoveryError = new Error('discovery failed');
    mockedOidc.discovery.mockRejectedValue(discoveryError);

    const module = new OIDCModule();

    await expect(module.setupClient()).rejects.toThrow('discovery failed');
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to setup OIDC client:', discoveryError);
  });

  it('buildRedirectUri returns absolute configured callback unchanged', () => {
    mockedConfig.get.mockImplementation(<T>(key: string): T => {
      if (key === 'oidc') {
        return {
          ...baseOidcConfig,
          callbackUrl: 'https://public.example.com/oauth2/callback',
        } as T;
      }
      if (key === 'secrets.finrem.finrem-citizen-ui-idam-client-secret') {
        return 'secret-from-config' as T;
      }
      throw new Error(`Unexpected config.get key: ${key}`);
    });

    const module = new OIDCModule();

    expect(module.buildRedirectUri(makeReq())).toBe('https://public.example.com/oauth2/callback');
  });

  it('buildRedirectUri uses forwarded headers for relative callback', () => {
    const module = new OIDCModule();
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'service.example.com',
      },
      protocol: 'http',
    });

    expect(module.buildRedirectUri(req)).toBe('https://service.example.com/oauth2/callback');
  });

  it('buildRedirectUri falls back to request protocol and host', () => {
    const module = new OIDCModule();
    const req = makeReq({
      protocol: 'https',
      get: (name: string): string | undefined => (name === 'host' ? 'local.test:9999' : undefined),
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

    const url = OIDCModule.getCurrentUrl(req);

    expect(url.href).toBe('https://forwarded.example.com/oauth2/callback?code=abc');
  });

  it('getCurrentUrl falls back to default host', () => {
    const req = makeReq({
      headers: {},
      protocol: 'http',
      originalUrl: '/hello',
      get: (): string | undefined => undefined,
    });

    const url = OIDCModule.getCurrentUrl(req);

    expect(url.href).toBe('http://localhost:3100/hello');
  });

  it('enableFor sets trust proxy and registers middleware and routes', () => {
    const app = makeApp();
    const module = new OIDCModule();

    module.enableFor(app as unknown as Express);

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

    module.enableFor(app as unknown as Express);

    const middleware = app.__middleware[0];
    const next = jest.fn<void, [unknown?]>();

    await middleware(makeReq(), makeRes(), next);

    expect(setupSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('setup middleware skips setupClient when already configured', async () => {
    const app = makeApp();
    const module = new OIDCModule();

    setClientConfig(module, {} as unknown as oidcClient.Configuration);

    const setupSpy = jest.spyOn(module, 'setupClient');

    module.enableFor(app as unknown as Express);

    const middleware = app.__middleware[0];
    const next = jest.fn<void, [unknown?]>();

    await middleware(makeReq(), makeRes(), next);

    expect(setupSpy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('setup middleware forwards setup errors to next', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    const setupError = new Error('setup failed');
    jest.spyOn(module, 'setupClient').mockRejectedValue(setupError);

    module.enableFor(app as unknown as Express);

    const middleware = app.__middleware[0];
    const next = jest.fn<void, [unknown?]>();

    await middleware(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledWith(setupError);
  });

  it('logout destroys session and redirects home when client is missing', () => {
    const app = makeApp();
    const module = new OIDCModule();

    module.enableFor(app as unknown as Express);

    const handler = app.__routes['/logout'];
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    handler(req, res, next);

    const redirectMock = (res as unknown as ResponseLike).redirect;
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('logout builds end-session URL and redirects to issuer logout', () => {
    const app = makeApp();
    const module = new OIDCModule();
    const clientConfig = {} as unknown as oidcClient.Configuration;

    setClientConfig(module, clientConfig);

    mockedOidc.buildEndSessionUrl.mockReturnValue(new URL('https://issuer.example/logout'));

    module.enableFor(app as unknown as Express);

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
        destroy: (callback: (err?: unknown) => void): void => callback(),
        save: (callback: () => void): void => callback(),
      },
    });
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    handler(req, res, next);

    expect(mockedOidc.buildEndSessionUrl).toHaveBeenCalledWith(clientConfig, {
      post_logout_redirect_uri: 'https://app.example.com',
      id_token_hint: 'id-token-123',
    });

    const redirectMock = (res as unknown as ResponseLike).redirect;
    expect(redirectMock).toHaveBeenCalledWith('https://issuer.example/logout');
  });

  it('logout logs destroy error and still redirects', () => {
    const app = makeApp();
    const module = new OIDCModule();
    const clientConfig = {} as unknown as oidcClient.Configuration;
    const destroyError = new Error('destroy failed');

    setClientConfig(module, clientConfig);

    mockedOidc.buildEndSessionUrl.mockReturnValue(new URL('https://issuer.example/logout'));

    module.enableFor(app as unknown as Express);

    const handler = app.__routes['/logout'];
    const req = makeReq({
      session: {
        user: {},
        destroy: (callback: (err?: unknown) => void): void => callback(destroyError),
        save: (callback: () => void): void => callback(),
      },
    });
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    handler(req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith('Session destroy error on logout:', destroyError);

    const redirectMock = (res as unknown as ResponseLike).redirect;
    expect(redirectMock).toHaveBeenCalledWith('https://issuer.example/logout');
  });

  it('login redirects with PKCE parameters when server supports PKCE', async () => {
    const app = makeApp();
    const module = new OIDCModule();

    const clientConfig = {
      serverMetadata: (): { supportsPKCE: () => boolean } => ({
        supportsPKCE: (): boolean => true,
      }),
    } as unknown as oidcClient.Configuration;

    setClientConfig(module, clientConfig);

    mockedOidc.randomPKCECodeVerifier.mockReturnValue('verifier-123');
    mockedOidc.calculatePKCECodeChallenge.mockResolvedValue('challenge-123');
    mockedOidc.buildAuthorizationUrl.mockReturnValue(new URL('https://issuer.example/auth'));

    module.enableFor(app as unknown as Express);

    const handler = app.__routes['/login'];
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'app.example.com',
      },
      session: {
        destroy: (callback: (err?: unknown) => void): void => callback(),
        save: (callback: () => void): void => callback(),
      },
    });
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    await handler(req, res, next);

    const requestAfter = req as unknown as RequestLike;
    expect(requestAfter.session.codeVerifier).toBe('verifier-123');
    expect(requestAfter.session.nonce).toBeUndefined();

    expect(mockedOidc.buildAuthorizationUrl).toHaveBeenCalledWith(clientConfig, {
      code_challenge: 'challenge-123',
      code_challenge_method: 'S256',
      redirect_uri: 'https://app.example.com/oauth2/callback',
      scope: baseOidcConfig.scope,
    });

    const redirectMock = (res as unknown as ResponseLike).redirect;
    expect(redirectMock).toHaveBeenCalledWith('https://issuer.example/auth');
    expect(next).not.toHaveBeenCalled();
  });

  it('login adds nonce when PKCE is not supported', async () => {
    const app = makeApp();
    const module = new OIDCModule();

    const clientConfig = {
      serverMetadata: (): { supportsPKCE: () => boolean } => ({
        supportsPKCE: (): boolean => false,
      }),
    } as unknown as oidcClient.Configuration;

    setClientConfig(module, clientConfig);

    mockedOidc.randomPKCECodeVerifier.mockReturnValue('verifier-456');
    mockedOidc.calculatePKCECodeChallenge.mockResolvedValue('challenge-456');
    mockedOidc.randomNonce.mockReturnValue('nonce-456');
    mockedOidc.buildAuthorizationUrl.mockReturnValue(new URL('https://issuer.example/auth2'));

    module.enableFor(app as unknown as Express);

    const handler = app.__routes['/login'];
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    await handler(req, res, next);

    const requestAfter = req as unknown as RequestLike;
    expect(requestAfter.session.nonce).toBe('nonce-456');

    expect(mockedOidc.buildAuthorizationUrl).toHaveBeenCalledWith(clientConfig, {
      code_challenge: 'challenge-456',
      code_challenge_method: 'S256',
      redirect_uri: 'http://localhost:3100/oauth2/callback',
      scope: baseOidcConfig.scope,
      nonce: 'nonce-456',
    });

    const redirectMock = (res as unknown as ResponseLike).redirect;
    expect(redirectMock).toHaveBeenCalledWith('https://issuer.example/auth2');
  });

  it('login wraps errors as OIDCAuthenticationError', async () => {
    const app = makeApp();
    const module = new OIDCModule();

    const clientConfig = {
      serverMetadata: (): { supportsPKCE: () => boolean } => ({
        supportsPKCE: (): boolean => true,
      }),
    } as unknown as oidcClient.Configuration;

    setClientConfig(module, clientConfig);

    mockedOidc.randomPKCECodeVerifier.mockImplementation(() => {
      throw new Error('boom');
    });

    module.enableFor(app as unknown as Express);

    const handler = app.__routes['/login'];
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    await handler(req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith('Login error:', expect.any(Error));

    const firstArg: unknown = next.mock.calls[0]?.[0];
    expect(firstArg).toBeInstanceOf(OIDCAuthenticationError);

    if (firstArg instanceof Error) {
      expect(firstArg.message).toBe('Failed to initiate login');
    }
  });

  it('callback stores user, clears temp values and redirects to returnTo', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    const clientConfig = {} as unknown as oidcClient.Configuration;

    setClientConfig(module, clientConfig);

    const claims = { sub: 'user-123' };
    const tokens = {
      access_token: 'access-123',
      id_token: 'id-123',
      refresh_token: 'refresh-123',
      claims: (): { sub: string } => claims,
    } as unknown as Awaited<ReturnType<typeof oidcClient.authorizationCodeGrant>>;

    mockedOidc.authorizationCodeGrant.mockResolvedValue(tokens);
    mockedOidc.fetchUserInfo.mockResolvedValue({
      sub: 'user-123',
      given_name: 'Lexi',
    });

    module.enableFor(app as unknown as Express);

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
        destroy: (callback: (err?: unknown) => void): void => callback(),
        save: (callback: () => void): void => callback(),
      },
    });
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    await handler(req, res, next);

    expect(mockedOidc.authorizationCodeGrant).toHaveBeenCalledWith(
      clientConfig,
      new URL('https://app.example.com/oauth2/callback?code=abc'),
      {
        expectedNonce: 'nonce-123',
        idTokenExpected: true,
        pkceCodeVerifier: 'verifier-123',
      }
    );

    expect(mockedOidc.fetchUserInfo).toHaveBeenCalledWith(clientConfig, 'access-123', 'user-123');

    const requestAfter = req as unknown as RequestLike;
    expect(requestAfter.session.user).toEqual({
      sub: 'user-123',
      given_name: 'Lexi',
      accessToken: 'access-123',
      idToken: 'id-123',
      refreshToken: 'refresh-123',
    });
    expect(requestAfter.session.codeVerifier).toBeUndefined();
    expect(requestAfter.session.nonce).toBeUndefined();
    expect(requestAfter.session.returnTo).toBeUndefined();

    const redirectMock = (res as unknown as ResponseLike).redirect;
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
    expect(next).not.toHaveBeenCalled();
  });

  it('callback defaults redirect to root when returnTo is missing', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    const clientConfig = {} as unknown as oidcClient.Configuration;

    setClientConfig(module, clientConfig);

    const tokens = {
      access_token: 'access-123',
      id_token: 'id-123',
      refresh_token: 'refresh-123',
      claims: (): { sub: string } => ({ sub: 'user-123' }),
    } as unknown as Awaited<ReturnType<typeof oidcClient.authorizationCodeGrant>>;

    mockedOidc.authorizationCodeGrant.mockResolvedValue(tokens);
    mockedOidc.fetchUserInfo.mockResolvedValue({
      sub: 'user-123',
    });

    module.enableFor(app as unknown as Express);

    const handler = app.__routes['/oauth2/callback'];
    const req = makeReq({
      originalUrl: '/oauth2/callback?code=abc',
      session: {
        codeVerifier: 'verifier',
        nonce: 'nonce',
        destroy: (callback: (err?: unknown) => void): void => callback(),
        save: (callback: () => void): void => callback(),
      },
    });
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    await handler(req, res, next);

    const redirectMock = (res as unknown as ResponseLike).redirect;
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('callback passes through OIDCCallbackError when no ID token is returned', async () => {
    const app = makeApp();
    const module = new OIDCModule();

    setClientConfig(module, {} as unknown as oidcClient.Configuration);

    const tokens = {
      access_token: 'access-123',
      id_token: undefined,
      refresh_token: 'refresh-123',
      claims: (): { sub: string } => ({ sub: 'user-123' }),
    } as unknown as Awaited<ReturnType<typeof oidcClient.authorizationCodeGrant>>;

    mockedOidc.authorizationCodeGrant.mockResolvedValue(tokens);

    module.enableFor(app as unknown as Express);

    const handler = app.__routes['/oauth2/callback'];
    const req = makeReq({
      session: {
        codeVerifier: 'verifier',
        nonce: 'nonce',
        destroy: (callback: (err?: unknown) => void): void => callback(),
        save: (callback: () => void): void => callback(),
      },
    });
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    await handler(req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith('OIDC callback error:', expect.any(OIDCCallbackError));

    const firstArg: unknown = next.mock.calls[0]?.[0];
    expect(firstArg).toBeInstanceOf(OIDCCallbackError);

    if (firstArg instanceof Error) {
      expect(firstArg.message).toBe('No ID token received from IDAM');
    }
  });

  it('callback wraps unexpected errors as OIDCCallbackError', async () => {
    const app = makeApp();
    const module = new OIDCModule();
    const unexpectedError = new Error('unexpected');

    setClientConfig(module, {} as unknown as oidcClient.Configuration);

    mockedOidc.authorizationCodeGrant.mockRejectedValue(unexpectedError);

    module.enableFor(app as unknown as Express);

    const handler = app.__routes['/oauth2/callback'];
    const req = makeReq({
      session: {
        codeVerifier: 'verifier',
        nonce: 'nonce',
        destroy: (callback: (err?: unknown) => void): void => callback(),
        save: (callback: () => void): void => callback(),
      },
    });
    const res = makeRes();
    const next = jest.fn<void, [unknown?]>();

    await handler(req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith('OIDC callback error:', unexpectedError);

    const firstArg: unknown = next.mock.calls[0]?.[0];
    expect(firstArg).toBeInstanceOf(OIDCCallbackError);

    if (firstArg instanceof Error) {
      expect(firstArg.message).toBe('Authentication callback failed');
    }
  });
});
