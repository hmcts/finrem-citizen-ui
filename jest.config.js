module.exports = {
  roots: ['<rootDir>/src/test/unit'],

  // ignore the a11y directory
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/test/a11y/'],

  testRegex: '(/src/test/unit/.*|\\.(test|spec))\\.(ts|js)$',

  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
