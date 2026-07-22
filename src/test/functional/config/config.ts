/**
 * Configuration for functional test API endpoints
 */

import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Determine if running in CI/pipeline (internal network) or locally (external)
// Check multiple Jenkins/CI env vars since different CI environments expose different vars
const isCI = !!process.env.CI
 || !!process.env.JENKINS_URL
 || !!process.env.BUILD_ID
 || !!process.env.JENKINS_HOME;

// Resolve service environment from .env target selection.
// Precedence:
// 1) IDAM_ENV explicit override
// 2) RUNNING_ENV target block value
// 3) fallback to aat
// Preview/local targets still use AAT shared identity/services unless explicitly overridden.
const getServiceEnv = (): string => {
  const explicit = (process.env.IDAM_ENV || '').trim().toLowerCase();
  if (explicit) {
    return explicit;
  }

  const runningEnv = (process.env.RUNNING_ENV || '').trim().toLowerCase();
  if (!runningEnv) {
    return 'aat';
  }

  if (runningEnv.startsWith('pr-') || runningEnv === 'preview' || runningEnv === 'local') {
    return 'aat';
  }

  return runningEnv;
};

const serviceEnv = getServiceEnv();
const runningEnv = (process.env.RUNNING_ENV || '').trim().toLowerCase();
const isPerftestTarget = runningEnv === 'perftest' || serviceEnv === 'perftest';

const pickSolicitorUsername = (): string => {
  // Perftest frequently relies on legacy solicitor credentials rather than Playwright mailinator users.
  if (isPerftestTarget) {
    return process.env.PLAYWRIGHT_SOLICITOR_USERNAME
      || process.env.USERNAME_SOLICITOR
      || process.env.PRD_SERVICE_USER_USERNAME
      || process.env.IDAM_SYSTEM_USERNAME
      || '';
  }

  return process.env.PLAYWRIGHT_SOLICITOR_USERNAME
    || process.env.USERNAME_SOLICITOR
    || process.env.PRD_SERVICE_USER_USERNAME
    || '';
};

const pickSolicitorPassword = (): string => {
  if (isPerftestTarget) {
    return process.env.PLAYWRIGHT_SOLICITOR_PSWD
      || process.env.PASSWORD_SOLICITOR
      || process.env.PRD_SERVICE_USER_PASSWORD
      || process.env.IDAM_SYSTEM_PASSWORD
      || '';
  }

  return process.env.PLAYWRIGHT_SOLICITOR_PSWD
    || process.env.PASSWORD_SOLICITOR
    || process.env.PRD_SERVICE_USER_PASSWORD
    || '';
};

const pickCaseworkerUsername = (): string => {
  if (isPerftestTarget) {
    return process.env.IDAM_SYSTEM_USERNAME
      || process.env.USERNAME_CASEWORKER
      || process.env.PRD_SERVICE_USER_USERNAME
      || '';
  }

  return process.env.USERNAME_CASEWORKER
    || process.env.IDAM_SYSTEM_USERNAME
    || process.env.PRD_SERVICE_USER_USERNAME
    || '';
};

const pickCaseworkerPassword = (): string => {
  if (isPerftestTarget) {
    return process.env.IDAM_SYSTEM_PASSWORD
      || process.env.PASSWORD_CASEWORKER
      || process.env.PRD_SERVICE_USER_PASSWORD
      || '';
  }

  return process.env.PASSWORD_CASEWORKER
    || process.env.IDAM_SYSTEM_PASSWORD
    || process.env.PRD_SERVICE_USER_PASSWORD
    || '';
};

// CCD Data Store API URL
// - In pipeline (CI): use internal AAT URL (accessible from cluster)
// - Locally: use external AAT URL unless overridden
const getCcdUrl = (): string => {
  // Explicit override takes priority (support common env var names)
  const ccdUrl = process.env.CCD_DATA_STORE_API_URL
    || process.env.CCD_URL;

  if (ccdUrl) {
    return ccdUrl;
  }

  // In CI/pipeline, use internal AAT URL
  if (isCI) {
    return 'http://ccd-data-store-api-aat.service.core-compute-aat.internal';
  }
  // Local development: use external AAT URL
  return 'https://ccd-data-store-api-aat.aat.platform.hmcts.net';
};

const config = {
  // CCD Data Store API
  ccdDataStoreApi: getCcdUrl(),

  // In CI, use system user as primary for caseworker events to avoid cross-role visibility delays
  useSystemUserForCaseworkerEvents:
    process.env.CCD_USE_SYSTEM_USER_FOR_CASEWORKER_EVENTS
      ? process.env.CCD_USE_SYSTEM_USER_FOR_CASEWORKER_EVENTS === 'true'
      : isCI || isPerftestTarget,

  // IDAM endpoints - derived from target block unless explicitly overridden
  idamApi: process.env.IDAM_TOKEN_URL
    || process.env.IDAM_API_URL
    || `https://idam-api.${serviceEnv}.platform.hmcts.net`,
  idamWebUrl: process.env.IDAM_WEB_URL
   || `https://idam-web-public.${serviceEnv}.platform.hmcts.net`,

  // S2S endpoint - derived from target block unless explicitly overridden
  s2sUrl: process.env.SERVICE_AUTH_PROVIDER_URL
   || `http://rpe-service-auth-provider-${serviceEnv}.service.core-compute-${serviceEnv}.internal`,

  // Microservice name for S2S - must match the secret loaded via SERVICE_AUTH_SECRET
  microservice: process.env.S2S_MICROSERVICE || 'finrem_citizen_ui',

  // Test user credentials (caseworker)
  caseworker: {
    username: pickCaseworkerUsername(),
    password: pickCaseworkerPassword(),
  },

  // Solicitor credentials
  solicitor: {
    username: pickSolicitorUsername(),
    password: pickSolicitorPassword(),
  },

  // System user credentials (fallback for cross-role CCD visibility in CI)
  systemUser: {
    username: process.env.IDAM_SYSTEM_USERNAME || '',
    password: process.env.IDAM_SYSTEM_PASSWORD || '',
  },

  // Citizen credentials (dynamically created in tests)
  citizen: {
    username: process.env.CITIZEN_USERNAME || '',
    password: process.env.CITIZEN_PASSWORD || '',
  },

  // IDAM client config
  idam: {
    clientId: 'finrem-citizen-ui',
    clientSecret: process.env.FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET || '',
    redirectUri: process.env.IDAM_REDIRECT_URI || 'http://localhost:3100/oauth2/callback',
    scope: 'openid profile roles',
  },
};

export default config;
