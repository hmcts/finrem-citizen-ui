import { AUTH, AuthOptions, xuiNode } from '@hmcts/rpx-xui-node-lib';
import { CookieOptions, NextFunction, Request, RequestHandler, Response } from 'express';

import { getConfigValue, showFeature } from '../configuration';
import {
  COOKIE_TOKEN,
  FEATURE_OIDC_ENABLED,
  FEATURE_REDIS_ENABLED,
  FEATURE_SECURE_COOKIE_ENABLED,
  IDAM_CLIENT,
  IDAM_SECRET,
  LOGIN_ROLE_MATCHER,
  MICROSERVICE,
  NOW,
  OAUTH_CALLBACK_URL,
  REDISCLOUD_URL,
  REDIS_KEY_PREFIX,
  REDIS_TTL,
  S2S_SECRET,
  SERVICES_IDAM_API_PATH,
  SERVICES_IDAM_ISS_URL,
  SERVICES_IDAM_WEB,
  SERVICE_S2S_PATH,
  SESSION_SECRET,
} from '../configuration/references';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('auth');

export const successCallback = async (req: Request, res: Response, next: NextFunction) : Promise<void>=> {
  // TODO: Create typed session interface (tracked in separate ticket)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { accessToken } = (req.session as any).passport.user.tokenset;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { userinfo } = (req.session as any).passport.user;

  logger.info('Setting session and cookies after successful authentication');

  const cookieOptions: CookieOptions = {
    sameSite: 'lax',
    secure: showFeature(FEATURE_SECURE_COOKIE_ENABLED),
    httpOnly: true,
  };

  // Set browser cookie with access token
  res.cookie(getConfigValue(COOKIE_TOKEN), accessToken, cookieOptions);

  // Store user info in session
  // TODO: Create typed session interface (tracked in separate ticket)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(req.session as any).auth) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req.session as any).auth = {
      email: userinfo.sub || userinfo.email,
      roles: userinfo.roles,
      token: accessToken,
      userId: userinfo.uid || userinfo.id,
    };
  }

  // Check if this is a token refresh (don't redirect)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(req as any).isRefresh) {
    return res.redirect('/');
  }
  next();
};

// Register success callback with xuiNode
xuiNode.on(AUTH.EVENT.AUTHENTICATE_SUCCESS, successCallback);

export const getFinremMiddleware = () : RequestHandler => {
  const idamWebUrl = getConfigValue(SERVICES_IDAM_WEB);
  const authorizationUrl = `${idamWebUrl}/login`;
  const secret = getConfigValue(IDAM_SECRET);
  const idamClient = getConfigValue(IDAM_CLIENT);
  const issuerUrl = getConfigValue(SERVICES_IDAM_ISS_URL);
  const idamApiPath = getConfigValue(SERVICES_IDAM_API_PATH);
  const s2sSecret = getConfigValue(S2S_SECRET);
  const tokenUrl = `${idamApiPath}/oauth2/token`;

  // OAuth2/OIDC configuration options
  const options: AuthOptions = {
    allowRolesRegex: getConfigValue(LOGIN_ROLE_MATCHER),
    authorizationURL: authorizationUrl,
    callbackURL: getConfigValue(OAUTH_CALLBACK_URL),
    clientID: idamClient,
    clientSecret: secret,
    discoveryEndpoint: `${idamWebUrl}/o`,
    issuerURL: issuerUrl,
    logoutURL: idamApiPath,
    responseTypes: ['code'],
    scope: 'profile openid roles',
    sessionKey: 'finrem-citizen-ui',
    tokenEndpointAuthMethod: 'client_secret_post',
    tokenURL: tokenUrl,
    useRoutes: true,
  };

  // Base session store options
  const baseStoreOptions = {
    cookie: {
      httpOnly: true,
      maxAge: 1800000, // 30 minutes
      secure: showFeature(FEATURE_SECURE_COOKIE_ENABLED),
      sameSite: 'lax' as const,
    },
    name: 'finrem-citizen-ui',
    resave: false,
    saveUninitialized: false,
    secret: getConfigValue(SESSION_SECRET),
  };

  // Redis store options (for production)
  const redisStoreOptions = {
    redisStore: {
      ...baseStoreOptions,
      redisStoreOptions: {
        redisCloudUrl: getConfigValue(REDISCLOUD_URL),
        redisKeyPrefix: getConfigValue(REDIS_KEY_PREFIX),
        redisTtl: getConfigValue(REDIS_TTL),
      },
    },
  };

  // File store options (for local development)
  const fileStoreOptions = {
    fileStore: {
      ...baseStoreOptions,
      fileStoreOptions: {
        filePath: getConfigValue(NOW) ? '/tmp/sessions' : '.sessions',
      },
    },
  };

  // Build the node lib options
  const nodeLibOptions = {
    auth: {
      s2s: {
        microservice: getConfigValue(MICROSERVICE),
        s2sEndpointUrl: `${getConfigValue(SERVICE_S2S_PATH)}/lease`,
        s2sSecret: s2sSecret.trim(),
      },
    },
    session: showFeature(FEATURE_REDIS_ENABLED) ? redisStoreOptions : fileStoreOptions,
  };

  // Choose between OIDC or OAuth2 based on feature flag
  const type = showFeature(FEATURE_OIDC_ENABLED) ? 'oidc' : 'oauth2';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (nodeLibOptions.auth as any)[type] = options;

  logger.info('Configuring XuiNodeLib with authentication options');
  return xuiNode.configure(nodeLibOptions);
};
