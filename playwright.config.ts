import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  paths: ['src/test/functional/features/*.feature'],
  require: ['src/test/steps/*.steps.ts', 'src/test/fixtures/fixtures.ts'],
});

export default defineConfig({
  testDir,
  reporter: [['html'], ['json', { outputFile: 'test-results.json' }], ['allure-playwright']],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3100',
    headless: true,
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
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
