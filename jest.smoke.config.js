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
    'jest-allure2-reporter',
    ['jest-junit', { outputDirectory: '.', outputName: 'junit-smoke.xml' }],
    [
      'jest-html-reporter',
      {
        pageTitle: 'Smoke Test Report',
        outputPath: 'smoke-output/reports/test-report.html',
        includeFailureMsg: true,
      },
    ],
  ],
};
