import { defineConfig, devices } from '@playwright/test';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// 1. Determine the target URL
const testUrl = process.env.TEST_URL || 'http://localhost:3100';

export default defineConfig({
  testDir: './src/test',
  testMatch: ['a11y/*.test.ts', 'functional/**/*.spec.ts'],

  reporter: [
    ['html', { outputFolder: 'functional-output/functional-test-report' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['junit', { outputFile: 'functional-output/functional-test-results.xml' }],
  ],
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
