import { CommonConfig, ProjectsConfig } from '@hmcts/playwright-common';
import { ReporterDescription, defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

/**
 * 1. Environment Loading
 */
dotenv.config();

const RUNNING_ENV = process.env.RUNNING_ENV || 'aat';
const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';

/**
 * 2. Enhanced HMCTS URL Logic
 */
const getBaseUrl = (): string => {
  if (process.env.TEST_URL) {
    return process.env.TEST_URL;
  }

  if (RUNNING_ENV.startsWith('pr-')) {
    return `https://finrem-citizen-ui-${RUNNING_ENV}.preview.platform.hmcts.net`;
  }

  return `https://manage-case.${RUNNING_ENV}.platform.hmcts.net`;
};

const finalBaseUrl = getBaseUrl();

/**
 * 3. Logging
 */
if (!process.env.ALREADY_LOGGED && process.env.PW_WORKER_INDEX === undefined) {
  /* eslint-disable no-console */
  console.log('-------------------------------------------------------');
  console.log(`🌍 TARGET URL:  ${finalBaseUrl}`);
  console.log(`📂 RESULTS DIR: ${resultsDir}`);
  console.log(`🤖 ENVIRONMENT: ${RUNNING_ENV}`);
  console.log('-------------------------------------------------------');
  /* eslint-enable no-console */

  process.env.ALREADY_LOGGED = 'true';
}

/**
 * 4. Playwright Configuration
 */
export default defineConfig({
  ...CommonConfig.recommended,

  testDir: './src/test',
  testMatch: ['a11y/*.test.ts', 'functional/**/*.spec.ts'],

  outputDir: `./${resultsDir}/artifacts`,

  reporter: [
    ...((CommonConfig.recommended.reporter as ReporterDescription[]) || []),
    ['html', { outputFolder: `./${resultsDir}/report`, open: 'never' }],
    ['allure-playwright', { resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results' }],
    ['junit', { outputFile: `./${resultsDir}/functional-test-results.xml` }],
  ] as ReporterDescription[],

  use: {
    ...CommonConfig.recommended.use,
    baseURL: finalBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },

  webServer: finalBaseUrl.includes('localhost')
    ? {
        command: 'yarn start',
        url: finalBaseUrl,
        reuseExistingServer: true,
        timeout: 120 * 1000,
        stderr: 'pipe',
        stdout: 'pipe',
      }
    : undefined,

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
