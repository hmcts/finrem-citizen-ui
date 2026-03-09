import { CommonConfig, ProjectsConfig } from '@hmcts/playwright-common';
import { ReporterDescription, defineConfig } from '@playwright/test';
import 'dotenv/config';

/**
 * 1. Environment Loading
 */

/**
 * 2. Dynamic Results Directory
 */
const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';

/**
 * 3. Enhanced HMCTS URL Logic
 */
const getBaseUrl = (): string => {
  const runningEnv = process.env.RUNNING_ENV || 'aat';
  const testUrl = process.env.TEST_URL;

  if (testUrl) {
    return testUrl;
  }

  if (runningEnv.startsWith('pr-')) {
    return `https://finrem-citizen-ui-${runningEnv}.preview.platform.hmcts.net`;
  }

  return `https://manage-case.${runningEnv}.platform.hmcts.net`;
};

const finalBaseUrl = getBaseUrl();

/// 1. Check we have already logged the process and aren't in a worker
if (!process.env.ALREADY_LOGGED && process.env.PW_WORKER_INDEX === undefined) {
  /* eslint-disable no-console */
  console.log('-------------------------------------------------------');
  console.log(`🌍 TARGET URL:  ${finalBaseUrl}`);
  console.log(`📂 RESULTS DIR: ${resultsDir}`);
  console.log(`🤖 ENVIRONMENT: ${process.env.RUNNING_ENV || 'Not Set'}`);
  console.log('-------------------------------------------------------');
  /* eslint-enable no-console */

  process.env.ALREADY_LOGGED = 'true';
}
export default defineConfig({
  ...CommonConfig.recommended,

  testDir: './src/test',
  testMatch: ['a11y/*.test.ts', 'functional/**/*.spec.ts', 'smoke/**/*.test.ts'],

  reporter: [
    ...((CommonConfig.recommended.reporter as ReporterDescription[]) || []),
    ['html', { outputFolder: `${resultsDir}/report`, open: 'never' }],
    ['allure-playwright', { resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results' }],
    ['junit', { outputFile: `${resultsDir}/functional-test-results.xml` }],
  ] as ReporterDescription[],

  outputDir: `${resultsDir}/artifacts`,

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
