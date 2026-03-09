import { type ReporterDescription, defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const resultsDir = process.env.TEST_RESULTS_DIR || 'functional-output';

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
const displayEnv = process.env.TEST_URL?.includes('localhost') ? 'local' : process.env.RUNNING_ENV || 'aat';

export default (async () => {
  // Dynamically import the ESM-only dependency
  const { CommonConfig, ProjectsConfig } = await import('@hmcts/playwright-common');

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

  return defineConfig({
    ...CommonConfig.recommended,
    testDir: './src/test',
    testMatch: ['a11y/*.test.ts', 'functional/**/*.spec.ts'],

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

    webServer: finalBaseUrl.includes('localhost')
      ? {
          command: 'NODE_OPTIONS="--openssl-legacy-provider" yarn start',
          url: finalBaseUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        }
      : undefined,

    projects: [
      { name: 'chromium', ...ProjectsConfig.chromium },
      { name: 'firefox', ...ProjectsConfig.firefox },
      { name: 'webkit', ...ProjectsConfig.webkit },
    ],
  });
})();
