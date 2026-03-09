import { defineConfig, devices } from '@playwright/test';

const testUrl = process.env.TEST_URL || 'http://localhost:3100';

export default defineConfig({
  testDir: './src/test',
  testMatch: ['a11y/*.test.ts', 'functional/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'functional-output/report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['junit', { outputFile: 'functional-output/functional-test-results.xml' }],
  ],

  timeout: 30 * 1000,
  expect: { timeout: 5000 },

  use: {
    baseURL: testUrl,
    headless: true,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: testUrl.includes('localhost')
    ? {
        command: 'NODE_OPTIONS="--openssl-legacy-provider" yarn start',
        url: testUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
