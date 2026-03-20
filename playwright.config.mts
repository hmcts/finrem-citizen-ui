import { type ReporterDescription, defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Import HMCTS common configs
const { CommonConfig, ProjectsConfig } = await import('@hmcts/playwright-common');

dotenv.config();

const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';
const reportName = process.env.REPORT_NAME || 'functional';
const allureDir = process.env.ALLURE_RESULTS_DIR || 'allure-results';
const junitFileName = process.env.JUNIT_REPORT_NAME || 'junit.xml';

const getBaseUrl = (): string => {
  if (process.env.TEST_URL) return process.env.TEST_URL;
  const env = process.env.RUNNING_ENV || 'aat';
  if (env.startsWith('pr-') || env.includes('preview')) {
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
  console.log(`📝 JUNIT FILE:  ${junitFileName}`);
  console.log('-------------------------------------------------------');
  process.env.ALREADY_LOGGED = 'true';
}

const baseReporters = (CommonConfig.recommended.reporter as ReporterDescription[]) || [];
const filteredReporters = baseReporters.filter(r => !['html', 'junit', 'allure-playwright'].includes(r[0] as string));

const testSelection = reportName.includes('accessibility')
  ? ['test/functional/specFiles/a11y/**/*.@(test|spec).ts']
  : ['test/functional/specFiles/**/*.@(test|spec).ts'];

export default defineConfig({
  ...CommonConfig.recommended,

  tsconfig: 'src/test/tsconfig.json',
  testDir: './src/test',
  testMatch: testSelection,

  reporter: [
    ...filteredReporters,
    ['html', { outputFolder: `${resultsDir}/playwright-${reportName}-test-report`, open: 'never' }],
    ['allure-playwright', { resultsDir: allureDir }],
    ['junit', { outputFile: `${resultsDir}/${junitFileName}` }],
  ] as ReporterDescription[],

  timeout: 60 * 1000,
  expect: { timeout: 10000 },

  use: {
    ...CommonConfig.recommended.use,
    baseURL: finalBaseUrl,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    ignoreHTTPSErrors: true,
    launchOptions: {
      ...CommonConfig.recommended.use?.launchOptions,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },

  projects: [
    { name: 'chromium', ...ProjectsConfig.chromium },
    { name: 'firefox', ...ProjectsConfig.firefox },
    { name: 'webkit', ...ProjectsConfig.webkit },
  ],

  // Only starts the local server if finalBaseUrl is localhost
  webServer: isLocal
    ? {
        command: 'NODE_OPTIONS="--openssl-legacy-provider" yarn start',
        url: `${finalBaseUrl}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
          IDAM_SECRET: process.env.IDAM_SECRET || 'dummy-secret',
          SESSION_SECRET: process.env.SESSION_SECRET || 'dummy-session-secret',
          PORT: '3100',
        },
      }
    : undefined,
});