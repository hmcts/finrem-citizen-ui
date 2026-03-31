/**
 * Configuration for functional test API endpoints
 */

import dotenv from 'dotenv';

dotenv.config();

// Determine if running in CI/pipeline (internal network) or locally (external)
const isCI = !!process.env.CI || !!process.env.JENKINS_URL;

// IDAM and S2S always use AAT (no PR-specific instances exist)
const idamEnv = 'aat';

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

  // IDAM endpoints - ALWAYS use AAT
  idamApi: process.env.IDAM_API_URL 
    || `https://idam-api.${idamEnv}.platform.hmcts.net`,
  idamWebUrl: process.env.IDAM_WEB_URL 
    || `https://idam-web-public.${idamEnv}.platform.hmcts.net`,

  // S2S also uses AAT
  s2sUrl: process.env.SERVICE_AUTH_PROVIDER_URL 
    || `http://rpe-service-auth-provider-${idamEnv}.service.core-compute-${idamEnv}.internal`,

  // Microservice name for S2S - use COS for CCD API access
  microservice: process.env.S2S_MICROSERVICE || 'finrem_case_orchestration',

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
