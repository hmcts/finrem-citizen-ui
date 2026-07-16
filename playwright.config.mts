import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import dotenv from 'dotenv';

// Import HMCTS common configs
const { CommonConfig, ProjectsConfig } = await import('@hmcts/playwright-common');

dotenv.config({ quiet: true });

// 1. Determine Target URL and Results Directory
const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';
const isShardedCi = process.env.PLAYWRIGHT_CI_SHARDED === 'true';

const getBaseUrl = (): string => {
  if (process.env.TEST_URL) {
    return process.env.TEST_URL;
  }
  const env = process.env.RUNNING_ENV || 'aat';
  if (env.startsWith('pr-')) {
    return `https://finrem-citizen-ui-${env}.preview.platform.hmcts.net`;
  }
  return `https://finrem-citizen-ui.${env}.platform.hmcts.net`;
};

const finalBaseUrl = getBaseUrl();
const isLocal = finalBaseUrl.includes('localhost');
const displayEnv = isLocal ? 'local' : process.env.RUNNING_ENV || 'aat';
const slowMoMs = Number(process.env.PLAYWRIGHT_SLOWMO_MS || '0');
const configuredWorkers = Number.parseInt(process.env.PLAYWRIGHT_WORKERS || '', 10);
const workerCount = Number.isFinite(configuredWorkers) && configuredWorkers > 0 ? configuredWorkers : 4;
const configuredRetries = Number.parseInt(process.env.PLAYWRIGHT_RETRIES || '', 10);
const retryCount = Number.isFinite(configuredRetries) && configuredRetries >= 0 ? configuredRetries : 3;
const commonUse = (CommonConfig.recommended.use ?? {}) as Record<string, unknown>;
const commonLaunchOptions = (commonUse.launchOptions ?? {}) as Record<string, unknown>;

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

// Only ignore API tests during functional test runs (not when running API tests explicitly)
const isRunningApiTests = process.env.RUN_API_TESTS === 'true';

export default defineConfig({
  ...CommonConfig.recommended,

 // Link to test-specific tsconfig

  tsconfig: 'src/test/tsconfig.json',

  workers: workerCount,
  retries: retryCount,

  testDir: './src/test',
  testMatch: ['**/*.spec.ts'],
  testIgnore: isRunningApiTests ? [] : ['api/**/*.spec.ts'],

  reporter: [
    ...((CommonConfig.recommended.reporter as ReporterDescription[]) || []),
    ...(isShardedCi
      ? [['blob', { outputDir: `${resultsDir}/blob-report` }]]
      : [['html', { outputFolder: `${resultsDir}/functional-test-report` }]]),
    ['junit', { outputFile: `${resultsDir}/functional-test-result.xml` }],
  ] as ReporterDescription[],

  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  use: {
    ...commonUse,
    baseURL: finalBaseUrl,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    ...(slowMoMs > 0
      ? {
          launchOptions: {
            ...commonLaunchOptions,
            slowMo: slowMoMs,
          },
        }
      : {}),
  },

  // 3. Merged WebServer logic (Local development support)
  webServer: isLocal
    ? {
        command: 'NODE_OPTIONS="--openssl-legacy-provider" ts-node -r dotenv/config -r tsconfig-paths/register src/main/server.ts',
        url: `${finalBaseUrl}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
          ...process.env,
          IDAM_SECRET: process.env.IDAM_SECRET || 'dummy-secret-for-playwright-tests',
          SESSION_SECRET: process.env.SESSION_SECRET || 'dummy-session-secret',
          ENABLE_TEST_SUPPORT_ROUTES: 'true',
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
