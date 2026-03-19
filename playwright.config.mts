import { type ReporterDescription, defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Import HMCTS common configs
const { CommonConfig, ProjectsConfig } = await import('@hmcts/playwright-common');

dotenv.config();

// 1. Determine Target URL and Results Directory
const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';

// Dynamic naming for reports based on the run type (functional vs a11y)
// This ensures they don't overwrite each other in the same folder
const reportName = process.env.REPORT_NAME || 'functional';
const allureDir = process.env.ALLURE_RESULTS_DIR || 'allure-results';

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

/* eslint-disable no-console */
if (!process.env.ALREADY_LOGGED && !process.env.PW_WORKER_INDEX) {
  console.log('-------------------------------------------------------');
  console.log(`🌍 TARGET URL:  ${finalBaseUrl}`);
  console.log(`📂 RESULTS DIR: ${resultsDir}`);
  console.log(`📊 REPORT NAME: ${reportName}`);
  console.log(`🤖 ENVIRONMENT: ${displayEnv}`);
  console.log('-------------------------------------------------------');
  process.env.ALREADY_LOGGED = 'true';
}

export default defineConfig({
  ...CommonConfig.recommended,

  tsconfig: 'src/test/tsconfig.json',
  testDir: './src/test',
  testMatch: ['a11y/*.test.ts', 'functional/**/*.spec.ts'],

  // 2. Updated dynamic reporting
  reporter: [
    ...((CommonConfig.recommended.reporter as ReporterDescription[]) || []),
    ['html', { outputFolder: `${resultsDir}/playwright-${reportName}-test-report` }],
    ['allure-playwright', { resultsDir: allureDir }],
    ['junit', { outputFile: `${resultsDir}/playwright-${reportName}-test-results.xml` }],
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
  ],
});
