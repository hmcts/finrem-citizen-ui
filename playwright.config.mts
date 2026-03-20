import { type ReporterDescription, defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Import HMCTS common configs
const { CommonConfig, ProjectsConfig } = await import('@hmcts/playwright-common');

dotenv.config();

// Determine Target URL and Results Directory
const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';

// Dynamic naming for reports based on the run type (functional or accessibility)
const reportName = process.env.REPORT_NAME || 'functional';
const allureDir = process.env.ALLURE_RESULTS_DIR || 'allure-results';

// Define junitFileName so Jenkins can aggregate multiple test runs (functional vs a11y)
const junitFileName = process.env.JUNIT_REPORT_NAME || 'junit.xml';

const getBaseUrl = (): string => {
  if (process.env.TEST_URL) {
    return process.env.TEST_URL;
  }
  const env = process.env.RUNNING_ENV || 'aat';

  // Standard HMCTS routing for Preview (PR) and Orchestrated envs
  if (env.startsWith('pr-') || env.includes('preview')) {
    return `https://finrem-citizen-ui-${env}.preview.platform.hmcts.net`;
  }
  return `https://manage-case.${env}.platform.hmcts.net`;
};

const finalBaseUrl = getBaseUrl();
const isLocal = finalBaseUrl.includes('localhost');
const displayEnv = isLocal ? 'local' : process.env.RUNNING_ENV || 'aat';

/* eslint-disable no-console */
// Log config metadata once per run (not for every worker)
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
/* eslint-enable no-console */

// Filter out existing reporters that we are overriding to prevent duplicates in Jenkins
const baseReporters = (CommonConfig.recommended.reporter as ReporterDescription[]) || [];
const filteredReporters = baseReporters.filter(r => !['html', 'junit', 'allure-playwright'].includes(r[0] as string));

/**
 * Logic to separate test runs:
 */
const testSelection = reportName.includes('accessibility')
  ? ['a11y/**/*.@(test|spec).ts']
  : ['functional/**/*.@(test|spec).ts'];

export default defineConfig({
  ...CommonConfig.recommended,

  tsconfig: 'src/test/tsconfig.json',
  testDir: './src/test',
  testMatch: testSelection,

  // Custom reporting setup for Jenkins and Allure
  reporter: [
    ...filteredReporters,
    ['html', { outputFolder: `${resultsDir}/playwright-${reportName}-test-report`, open: 'never' }],
    ['allure-playwright', { resultsDir: allureDir }],
    ['junit', { outputFile: `${resultsDir}/${junitFileName}` }],
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

  // Local development server setup
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

  // HMCTS standard browser projects
  projects: [
    { name: 'chromium', ...ProjectsConfig.chromium },
    { name: 'firefox', ...ProjectsConfig.firefox },
    { name: 'webkit', ...ProjectsConfig.webkit },
  ],
});
