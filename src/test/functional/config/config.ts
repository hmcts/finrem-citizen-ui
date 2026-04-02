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

type ServiceEnvironment = {
  publicEnv: 'aat' | 'staging';
  coreComputeEnv: 'aat' | 'stg';
};

const inferEnvironmentFromUrl = (url?: string): ServiceEnvironment | null => {
  if (!url) {
    return null;
  }

  const normalized = url.toLowerCase();

  if (normalized.includes('.preview.platform.hmcts.net') || normalized.includes('-pr-')) {
    // Preview apps run against AAT shared services.
    return { publicEnv: 'aat', coreComputeEnv: 'aat' };
  }

  if (normalized.includes('.staging.platform.hmcts.net') || normalized.includes('.stg.platform.hmcts.net')) {
    return { publicEnv: 'staging', coreComputeEnv: 'stg' };
  }

  if (normalized.includes('.aat.platform.hmcts.net')) {
    return { publicEnv: 'aat', coreComputeEnv: 'aat' };
  }

  return null;
};

const inferEnvironmentFromName = (name?: string): ServiceEnvironment | null => {
  if (!name) {
    return null;
  }

  const normalized = name.toLowerCase();

  if (normalized === 'aat' || normalized.startsWith('pr-') || normalized === 'preview') {
    return { publicEnv: 'aat', coreComputeEnv: 'aat' };
  }

  if (normalized === 'staging' || normalized === 'stg') {
    return { publicEnv: 'staging', coreComputeEnv: 'stg' };
  }

  return null;
};

const resolvedEnvironment: ServiceEnvironment =
  inferEnvironmentFromName(process.env.IDAM_ENV)
  || inferEnvironmentFromName(process.env.RUNNING_ENV)
  || inferEnvironmentFromName(process.env.ENVIRONMENT_NAME)
  || inferEnvironmentFromUrl(process.env.TEST_URL)
  || { publicEnv: 'aat', coreComputeEnv: 'aat' };

// CCD Data Store API URL
// - In pipeline (CI): use internal URL (accessible from cluster)
// - Locally: use external URL unless overridden
const getCcdUrl = (): string => {
  // Explicit override takes priority (support common env var names)
  const ccdUrl = process.env.CCD_DATA_STORE_API_URL
    || process.env.CCD_URL;

  if (ccdUrl) {
    return ccdUrl;
  }

  // In CI/pipeline, use internal environment URL
  if (isCI) {
    return `http://ccd-data-store-api-${resolvedEnvironment.coreComputeEnv}.service.core-compute-${resolvedEnvironment.coreComputeEnv}.internal`;
  }
  // Local development: use external environment URL
  return `https://ccd-data-store-api-${resolvedEnvironment.publicEnv}.${resolvedEnvironment.publicEnv}.platform.hmcts.net`;
};

const config = {
  // CCD Data Store API
  ccdDataStoreApi: getCcdUrl(),

  // In CI, use system user as primary for caseworker events to avoid cross-role visibility delays
  useSystemUserForCaseworkerEvents:
    process.env.CCD_USE_SYSTEM_USER_FOR_CASEWORKER_EVENTS
      ? process.env.CCD_USE_SYSTEM_USER_FOR_CASEWORKER_EVENTS === 'true'
      : isCI,

  // IDAM endpoints
  idamApi: process.env.IDAM_API_URL 
    || `https://idam-api.${resolvedEnvironment.publicEnv}.platform.hmcts.net`,
  idamWebUrl: process.env.IDAM_WEB_URL 
    || `https://idam-web-public.${resolvedEnvironment.publicEnv}.platform.hmcts.net`,

  // S2S endpoint
  s2sUrl: process.env.SERVICE_AUTH_PROVIDER_URL 
    || `http://rpe-service-auth-provider-${resolvedEnvironment.coreComputeEnv}.service.core-compute-${resolvedEnvironment.coreComputeEnv}.internal`,

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
