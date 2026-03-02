import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// 1. Determine the target URL
const testUrl = process.env.TEST_URL || 'http://localhost:3100';

const bddDir = defineBddConfig({
  paths: ['src/test/functional/features/*.feature'],
  require: ['src/test/steps/*.steps.ts', 'src/test/fixtures/fixtures.ts'],
});

export default defineConfig({
  testDir: './',
  testMatch: [
    bddDir + '/**/*.spec.js', // include BDD tests
    '**/src/test/a11y/*.test.ts', // include AXE tests
  ],

  reporter: [['html'], ['json', { outputFile: 'test-results.json' }], ['allure-playwright']],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  // 2. Use the dynamic URL
  use: {
    baseURL: testUrl,
    headless: true,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },

  // 3. Conditional WebServer
  // Only start the local app if the URL contains 'localhost'
  webServer: testUrl.includes('localhost')
    ? {
        command: 'NODE_OPTIONS="--openssl-legacy-provider" yarn start',
        url: testUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      }
    : undefined,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
