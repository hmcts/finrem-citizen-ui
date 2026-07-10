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

function resolveServiceEnv(): string {
  const explicitEnv = process.env.IDAM_ENV?.trim();
  if (explicitEnv) {
    return explicitEnv;
  }

  const runningEnv = (process.env.RUNNING_ENV || '').trim().toLowerCase();
  if (runningEnv.startsWith('pr-') || runningEnv === 'preview') {
    return 'aat';
  }

  if (runningEnv === 'perf') {
    return 'perftest';
  }

  return runningEnv || 'aat';
}

const serviceEnv = resolveServiceEnv();

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
      : isCI,

  // Default IDAM/S2S endpoints follow the selected target environment unless
  // explicit env vars override them. Preview/PR apps still share AAT services.
  idamApi: process.env.IDAM_TOKEN_URL
    || `https://idam-api.${serviceEnv}.platform.hmcts.net`,
  idamWebUrl: process.env.IDAM_WEB_URL
   || `https://idam-web-public.${serviceEnv}.platform.hmcts.net`,

  // S2S defaults to the same resolved service environment.
  s2sUrl: process.env.SERVICE_AUTH_PROVIDER_URL
   || `http://rpe-service-auth-provider-${serviceEnv}.service.core-compute-${serviceEnv}.internal`,

  // Microservice name for S2S - must match the secret loaded via SERVICE_AUTH_SECRET
  microservice: process.env.S2S_MICROSERVICE || 'finrem_citizen_ui',

  // Test user credentials (caseworker)
  caseworker: {
    username: process.env.USERNAME_CASEWORKER || '',
    password: process.env.PASSWORD_CASEWORKER || '',
  },

  // Solicitor credentials
  solicitor: {
    username: process.env.PLAYWRIGHT_SOLICITOR_USERNAME || '',
    password: process.env.PLAYWRIGHT_SOLICITOR_PSWD || '',
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
