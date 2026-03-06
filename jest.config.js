module.exports = {
  roots: ['<rootDir>/src/test/unit'],
  // Only run unit tests by default
  // Ignore node_modules and a11y tests by default, as they are run separately
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/test/a11y/'],
  testRegex: '(\\.(test|spec))\\.(ts|js)$',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
