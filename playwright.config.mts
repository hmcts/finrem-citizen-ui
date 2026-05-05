import { defineConfig, devices,type ReporterDescription } from '@playwright/test';
import dotenv from 'dotenv';

// Import HMCTS common configs
const { CommonConfig, ProjectsConfig } = await import('@hmcts/playwright-common');

dotenv.config({ quiet: true });

// 1. Determine Target URL and Results Directory
const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';

const getBaseUrl = (): string => {
  if (process.env.TEST_URL) {
    return process.env.TEST_URL;
  }
  const env = process.env.RUNNING_ENV || 'aat';
  if (env.startsWith('pr-')) {
    return `https://finrem-citizen-ui-${env}.preview.platform.hmcts.net`;
  }
  // For AAT/demo/etc use the citizen UI, not manage-case (XUI)
  return `https://finrem-citizen-ui.${env}.platform.hmcts.net`;
};

const finalBaseUrl = getBaseUrl();
const isLocal = finalBaseUrl.includes('localhost');
const displayEnv = isLocal ? 'local' : process.env.RUNNING_ENV || 'aat';
const parsedWorkers = Number.parseInt(process.env.PW_WORKERS ?? '', 10);
const workers = Number.isFinite(parsedWorkers) && parsedWorkers > 0
  ? parsedWorkers
  : (process.env.CI ? 1 : 2);

// 2. Logging for clarity
/* eslint-disable no-console */
if (!process.env.ALREADY_LOGGED && !process.env.PW_WORKER_INDEX) {
  console.log('-------------------------------------------------------');
  console.log(`🌍 TARGET URL:  ${finalBaseUrl}`);
  console.log(`📂 RESULTS DIR: ${resultsDir}`);
  console.log(`🤖 ENVIRONMENT: ${displayEnv}`);
  console.log('-------------------------------------------------------');
  process.env.ALREADY_LOGGED = 'true';
}
/* eslint-enable no-console */

export default defineConfig({
  ...CommonConfig.recommended,
  workers,
  fullyParallel: false,

  // Link to your test-specific tsconfig
  tsconfig: 'src/test/tsconfig.json',

  testDir: './src/test',
  testMatch: ['a11y/*.test.ts', 'functional/**/*.spec.ts'],

  reporter: [
    ...((CommonConfig.recommended.reporter as ReporterDescription[]) || []),
    ['html', { outputFolder: `${resultsDir}/functional-test-report` }],
    ['junit', { outputFile: `${resultsDir}/functional-test-result.xml` }],
  ] as ReporterDescription[],

  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  use: {
    ...CommonConfig.recommended.use,
    baseURL: finalBaseUrl,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },

  // 3. Merged WebServer logic (Local development support)
  webServer: isLocal
    ? [
        {
          // Main Application
          command: 'NODE_OPTIONS="--openssl-legacy-provider" yarn ts-node -r tsconfig-paths/register src/main/server.ts',
          url: 'http://localhost:3100/health',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
          env: {
            ...process.env,
            NODE_ENV: 'development',
            IDAM_SECRET: process.env.IDAM_SECRET || 'dummy-secret-for-playwright-tests',
            SESSION_SECRET: process.env.SESSION_SECRET || 'dummy-session-secret',
            CASE_API_URL: 'http://localhost:4100',
            SERVICES_CASE_API_URL: 'http://localhost:4100',
            SERVICES_CCD_DATA_STORE_API_BASE_URL: 'http://localhost:4100',
            IDAM_API_URL: process.env.IDAM_API_URL || 'http://localhost:5000',
            S2S_URL: process.env.S2S_URL || 'http://localhost:4502',
            ENABLE_TEST_SUPPORT_ROUTES: 'true',
            PORT: '3100',
          },
        },
        {
          // Mock Case API
          command: 'yarn start:mock-case-api',
          port: 4100,
          reuseExistingServer: !process.env.CI,
        },
      ]
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
