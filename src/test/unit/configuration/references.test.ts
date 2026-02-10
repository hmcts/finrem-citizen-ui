import {
  COOKIE_TOKEN,
  COOKIES_USERID,
  ENVIRONMENT,
  FEATURE_HELMET_ENABLED,
  FEATURE_OIDC_ENABLED,
  FEATURE_REDIS_ENABLED,
  FEATURE_SECURE_COOKIE_ENABLED,
  HELMET,
  IDAM_CLIENT,
  IDAM_SECRET,
  LOGIN_ROLE_MATCHER,
  MICROSERVICE,
  NOW,
  OAUTH_CALLBACK_URL,
  PROTOCOL,
  REDIS_KEY_PREFIX,
  REDIS_TTL,
  REDISCLOUD_URL,
  S2S_SECRET,
  SERVICE_S2S_PATH,
  SERVICES_IDAM_API_PATH,
  SERVICES_IDAM_ISS_URL,
  SERVICES_IDAM_WEB,
  SESSION_SECRET,
} from '../../../main/configuration/references';

describe('configuration/references', () => {
  it('should export environment reference', () => {
    expect(ENVIRONMENT).toBe('environment');
  });

  it('should export cookie references', () => {
    expect(COOKIE_TOKEN).toBe('cookies.token');
    expect(COOKIES_USERID).toBe('cookies.userId');
  });

  it('should export IDAM config references', () => {
    expect(IDAM_CLIENT).toBe('idamClient');
    expect(MICROSERVICE).toBe('microservice');
    expect(OAUTH_CALLBACK_URL).toBe('oauthCallbackUrl');
    expect(LOGIN_ROLE_MATCHER).toBe('loginRoleMatcher');
    expect(PROTOCOL).toBe('protocol');
  });

  it('should export service references', () => {
    expect(SERVICES_IDAM_API_PATH).toBe('services.idamApi');
    expect(SERVICES_IDAM_WEB).toBe('services.idamWeb');
    expect(SERVICES_IDAM_ISS_URL).toBe('iss');
    expect(SERVICE_S2S_PATH).toBe('services.s2s');
  });

  it('should export session secret reference', () => {
    expect(SESSION_SECRET).toBe('sessionSecret');
  });

  it('should export secret references', () => {
    expect(S2S_SECRET).toBe('secrets.finrem.finrem-citizen-s2s-client-secret');
    expect(IDAM_SECRET).toBe('secrets.finrem.finrem-citizen-oauth2-client-secret');
  });

  it('should export feature flag references', () => {
    expect(FEATURE_SECURE_COOKIE_ENABLED).toBe('secureCookieEnabled');
    expect(FEATURE_HELMET_ENABLED).toBe('helmetEnabled');
    expect(FEATURE_REDIS_ENABLED).toBe('redisEnabled');
    expect(FEATURE_OIDC_ENABLED).toBe('oidcEnabled');
  });

  it('should export redis config references', () => {
    expect(REDISCLOUD_URL).toBe('secrets.finrem.finrem-citizen-redis-connection-string');
    expect(REDIS_TTL).toBe('redis.ttl');
    expect(REDIS_KEY_PREFIX).toBe('redis.prefix');
  });

  it('should export file session store reference', () => {
    expect(NOW).toBe('now');
  });

  it('should export helmet reference', () => {
    expect(HELMET).toBe('helmet');
  });
});
