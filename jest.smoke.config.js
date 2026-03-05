module.exports = {
  roots: ['<rootDir>/src/test/smoke'],
  testRegex: '(/src/test/.*|\\.test)\\.(ts|js)$',
  testRunner: 'jest-circus/runner',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'smoke-output',
        outputName: 'smoke--test-results.xml',
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'Smoke Test Report',
        outputPath: 'smoke-output/smoke-test-report.html',
        includeFailureMsg: true,
      },
    ],
    // Separate Allure folder for smoke
    ['jest-allure2-reporter', { resultsDir: 'allure-results-smoke' }],
  ],
};
