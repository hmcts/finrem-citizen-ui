import { CommonConfig, ProjectsConfig } from '@hmcts/playwright-common';
import { type ReporterDescription, defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

/**
 * 1. Environment Loading
 * Best Practice: Use 'source .env' in shell.
 * dotenv.config() is here as a fallback for local IDE runs.
 */
dotenv.config();

/**
 * 2. Enhanced HMCTS URL Logic
 */
const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';

const getBaseUrl = (): string => {
  // Priority 1: Explicitly defined TEST_URL (e.g., localhost:3100)
  if (process.env.TEST_URL) {
    return process.env.TEST_URL;
  }

  const env = process.env.RUNNING_ENV || 'aat';

  // Priority 2: Preview/PR Environments
  if (env.startsWith('pr-')) {
    return `https://finrem-citizen-ui-${env}.preview.platform.hmcts.net`;
  }

  // Priority 3: Standard AAT/Demo Environments
  return `https://manage-case.${env}.platform.hmcts.net`;
};

const finalBaseUrl = getBaseUrl();

/**
 * 3. Correct the Environment Label for Logging
 */
const displayEnv = process.env.TEST_URL?.includes('localhost') ? 'local' : process.env.RUNNING_ENV || 'aat';

/**
 * Logging
 */
if (!process.env.ALREADY_LOGGED && process.env.PW_WORKER_INDEX === undefined) {
  /* eslint-disable no-console */
  console.log('-------------------------------------------------------');
  console.log(`🌍 TARGET URL:  ${finalBaseUrl}`);
  console.log(`📂 RESULTS DIR: ${resultsDir}`);
  console.log(`🤖 ENVIRONMENT: ${displayEnv}`);
  console.log('-------------------------------------------------------');
  /* eslint-enable no-console */

  process.env.ALREADY_LOGGED = 'true';
}

export default defineConfig({
  /* Inherit HMCTS recommended security & performance defaults */
  ...CommonConfig.recommended,

  testDir: './src/test',
  testMatch: ['a11y/*.test.ts', 'functional/**/*.spec.ts'],

  /* 4. Reporting: reporters + local artifacts */
  reporter: [
    ...((CommonConfig.recommended.reporter as ReporterDescription[]) || []),
    ['html', { outputFolder: 'functional-output/functional-test-report' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['junit', { outputFile: 'functional-output/functional-test-results.xml' }],
  ] as ReporterDescription[],

  use: {
    ...CommonConfig.recommended.use,
    baseURL: finalBaseUrl,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },

  /* 5. WebServer: Standard logic for localhost testing */
  webServer: finalBaseUrl.includes('localhost')
    ? {
        command: 'NODE_OPTIONS="--openssl-legacy-provider" yarn start',
        url: finalBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      }
    : undefined,

  /* 6. Projects: Standardized HMCTS browser engines */
  projects: [
    {
      name: 'chromium',
      ...ProjectsConfig.chromium,
    },
    {
      name: 'firefox',
      ...ProjectsConfig.firefox,
    },
    {
      name: 'webkit',
      ...ProjectsConfig.webkit,
    },
  ],
});
