import path from 'path';

import { type ReporterDescription, defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Import HMCTS common configs
const { CommonConfig, ProjectsConfig } = await import('@hmcts/playwright-common');

dotenv.config();

// 1. Determine Paths, Target URL and Results Directory
const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';
const authFile = path.join(process.cwd(), 'test/.auth/user.json');

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
  console.log(`🤖 ENVIRONMENT: ${displayEnv}`);
  console.log(`🔑 AUTH FILE:  ${authFile}`);
  console.log('-------------------------------------------------------');
  process.env.ALREADY_LOGGED = 'true';
}
/* eslint-enable no-console */

export default defineConfig({
  ...CommonConfig.recommended,

  // Link to test-specific tsconfig
  tsconfig: 'src/test/tsconfig.json',

  testDir: './src/test',
  testMatch: ['**/*.auth.setup.ts', 'a11y/*.test.ts', 'functional/**/*.spec.ts'],

  reporter: [
    ...((CommonConfig.recommended.reporter as ReporterDescription[]) || []),
    ['html', { outputFolder: `${resultsDir}/functional-test-report` }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['junit', { outputFile: `${resultsDir}/functional-test-results.xml` }],
  ] as ReporterDescription[],

  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },

  use: {
    ...CommonConfig.recommended.use,
    baseURL: finalBaseUrl,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },

  // 3. Merged WebServer logic (Local development support)
  webServer: isLocal
    ? {
        command: 'NODE_OPTIONS="--openssl-legacy-provider" yarn start',
        url: `${finalBaseUrl}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
          IDAM_SECRET: process.env.FINREM_CITIZEN_UI_IDAM_CLIENT_SECRET || 'dummy-secret-for-playwright-tests',
          SESSION_SECRET: process.env.SESSION_SECRET || 'dummy-session-secret',
          PORT: '3100',
        },
      }
    : undefined,

  projects: [
    // --- AUTH SETUP PROJECT ---
    {
      name: 'setup',
      testMatch: /.*\.auth\.setup\.ts/,
    },

    // --- BROWSER PROJECTS ---
    {
      name: 'chromium',
      ...ProjectsConfig.chromium,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      ...ProjectsConfig.firefox,
      use: {
        ...devices['Desktop Firefox'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      ...ProjectsConfig.webkit,
      use: {
        ...devices['Desktop Safari'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],
});
