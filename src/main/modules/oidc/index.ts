import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import type { Express, NextFunction, Request, Response } from 'express';
import * as oidcClient from 'openid-client';

import type { OIDCConfig } from './config.interface';
import { OIDCAuthenticationError, OIDCCallbackError } from './errors';

export class OIDCModule {
  private clientConfig: oidcClient.Configuration | undefined;
  private readonly oidcConfig: OIDCConfig = config.get<OIDCConfig>('oidc');
  private readonly logger = Logger.getLogger('oidc');

  constructor() {
    this.setupClient().catch((err: unknown) => {
      this.logger.error('Failed to setup OIDC client on startup:', err);
    });
  }

  public async setupClient(): Promise<void> {
    this.logger.info('Setting up OIDC client');
    const issuer = new URL(this.oidcConfig.issuer);
    const clientSecret = config.get<string>('secrets.finrem.idam-secret');
    this.clientConfig = await oidcClient.discovery(issuer, this.oidcConfig.clientId, clientSecret);
    this.logger.info('OIDC client configured successfully');
  }

  public buildRedirectUri(req: Request): string {
    const configured = this.oidcConfig.callbackUrl;
    if (configured.startsWith('http://') || configured.startsWith('https://')) {
      return configured;
    }
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = typeof forwardedProto === 'string' ? forwardedProto : req.protocol;
    const forwardedHost = req.headers['x-forwarded-host'];
    const host = typeof forwardedHost === 'string' ? forwardedHost : (req.get('host') ?? 'localhost:3100');
    return `${protocol}://${host}${configured}`;
  }

  public static getCurrentUrl(req: Request): URL {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = typeof forwardedProto === 'string' ? forwardedProto : req.protocol;
    const forwardedHost = req.headers['x-forwarded-host'];
    const host = typeof forwardedHost === 'string' ? forwardedHost : (req.get('host') ?? 'localhost:3100');
    return new URL(req.originalUrl, `${protocol}://${host}`);
  }

  public enableFor(app: Express): void {
    app.set('trust proxy', true);

    app.get('/logout', (req: Request, res: Response): void => {
      if (!this.clientConfig) {
        req.session.destroy(() => res.redirect('/'));
        return;
      }

      const logoutUrl = oidcClient.buildEndSessionUrl(this.clientConfig, {
        post_logout_redirect_uri: OIDCModule.getCurrentUrl(req).origin,
        ...(req.session.user?.idToken ? { id_token_hint: req.session.user.idToken } : {}),
      });

      req.session.destroy((err: unknown) => {
        if (err) {
          this.logger.error('Session destroy error on logout:', err);
        }
        res.redirect(logoutUrl.href);
      });
    });

    app.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!this.clientConfig) {
        try {
          await this.setupClient();
        } catch (err: unknown) {
          next(err);
          return;
        }
      }
      next();
    });

    app.get('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const codeVerifier = oidcClient.randomPKCECodeVerifier();
        req.session.codeVerifier = codeVerifier;
        const codeChallenge = await oidcClient.calculatePKCECodeChallenge(codeVerifier);
        const redirectUri = this.buildRedirectUri(req);

        const parameters: Record<string, string> = {
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          redirect_uri: redirectUri,
          scope: this.oidcConfig.scope,
        };

        if (!this.clientConfig!.serverMetadata().supportsPKCE()) {
          req.session.nonce = oidcClient.randomNonce();
          parameters['nonce'] = req.session.nonce;
        }

        const authUrl = oidcClient.buildAuthorizationUrl(this.clientConfig!, parameters);
        res.redirect(authUrl.href);
      } catch (err: unknown) {
        this.logger.error('Login error:', err);
        next(new OIDCAuthenticationError('Failed to initiate login'));
      }
    });

    app.get('/oauth2/callback', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { codeVerifier, nonce } = req.session;
        const callbackUrl = OIDCModule.getCurrentUrl(req);

        const tokens = await oidcClient.authorizationCodeGrant(this.clientConfig!, callbackUrl, {
          expectedNonce: nonce,
          idTokenExpected: true,
          pkceCodeVerifier: codeVerifier,
        });

        const { access_token, id_token, refresh_token } = tokens;
        const claims = tokens.claims();

        if (!id_token || !claims) {
          throw new OIDCCallbackError('No ID token received from IDAM');
        }

        const userInfo = await oidcClient.fetchUserInfo(this.clientConfig!, access_token, claims.sub);

        req.session.user = {
          ...userInfo,
          accessToken: access_token,
          idToken: id_token,
          refreshToken: refresh_token,
        };

        req.session.save(() => {
          delete req.session.codeVerifier;
          delete req.session.nonce;
          const returnTo = req.session.returnTo ?? '/';
          delete req.session.returnTo;
          res.redirect(returnTo);
        });
      } catch (err: unknown) {
        this.logger.error('OIDC callback error:', err);
        next(err instanceof OIDCCallbackError ? err : new OIDCCallbackError('Authentication callback failed'));
      }
    });
  }
}
