import { type ReporterDescription, defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Import HMCTS common configs
const { CommonConfig, ProjectsConfig } = await import('@hmcts/playwright-common');

dotenv.config();

// 1. Determine Target URL and Results Directory
const isA11y = process.env.TEST_TYPE === 'a11y';
const defaultDir = isA11y ? 'a11y-output' : 'functional-output';
const resultsDir = process.env.TEST_RESULTS_DIR || defaultDir;

// Dynamic naming for reports
const reportName = isA11y ? 'a11y' : 'functional';
const allureDir = isA11y ? 'allure-results-a11y' : 'allure-results';

const getBaseUrl = (): string => {
  if (process.env.TEST_URL) {
    return process.env.TEST_URL;
  }
  const env = process.env.RUNNING_ENV || 'aat';
  if (env.startsWith('pr-')) {
    return `https://finrem-citizen-ui-${env}.preview.platform.hmcts.net`;
  }
  return `https://manage-case.${env}.platform.hmcts.net`;
};

const finalBaseUrl = getBaseUrl();
const isLocal = finalBaseUrl.includes('localhost');
const displayEnv = isLocal ? 'local' : process.env.RUNNING_ENV || 'aat';

// 2. Logging for clarity
/* eslint-disable no-console */
if (!process.env.ALREADY_LOGGED && !process.env.PW_WORKER_INDEX) {
  console.log('-------------------------------------------------------');
  console.log(`🌍 TARGET URL:  ${finalBaseUrl}`);
  console.log(`📂 RESULTS DIR: ${resultsDir}`);
  console.log(`🤖 TEST TYPE:  ${reportName.toUpperCase()}`);
  console.log(`🤖 ENVIRONMENT: ${displayEnv}`);
  console.log('-------------------------------------------------------');
  process.env.ALREADY_LOGGED = 'true';
}
/* eslint-enable no-console */

export default defineConfig({
  ...CommonConfig.recommended,

  tsconfig: 'src/test/tsconfig.json',

  testDir: './src/test',
  testMatch: isA11y ? ['a11y/*.test.ts'] : ['functional/**/*.spec.ts'],

  reporter: [
    ...((CommonConfig.recommended.reporter as ReporterDescription[]) || []),
    ['html', { outputFolder: `${resultsDir}/${reportName}-test-report` }],
    ['allure-playwright', { resultsDir: allureDir }],
    ['junit', { outputFile: `${resultsDir}/${reportName}-test-results.xml` }],
  ] as ReporterDescription[],

  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  use: {
    ...CommonConfig.recommended.use,
    baseURL: finalBaseUrl,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },

  webServer: isLocal
    ? {
        command: 'NODE_OPTIONS="--openssl-legacy-provider" yarn start',
        url: `${finalBaseUrl}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
          IDAM_SECRET: process.env.IDAM_SECRET || 'dummy-secret-for-playwright-tests',
          SESSION_SECRET: process.env.SESSION_SECRET || 'dummy-session-secret',
          PORT: '3100',
        },
      }
    : undefined,

  projects: [
    {
      name: 'chromium',
      ...ProjectsConfig.chromium,
      use: { ...devices['Desktop Chrome'] },
    },
    // only run a11y on Chromium to save time/resources in CI
    ...(!isA11y
      ? [
          {
            name: 'firefox',
            ...ProjectsConfig.firefox,
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            ...ProjectsConfig.webkit,
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),
  ],
});
