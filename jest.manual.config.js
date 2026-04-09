// only used for the manual test setup script, which needs to run with the same jest config but without the testPathIgnorePatterns that exclude the manual test file from the main jest config.

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testPathIgnorePatterns: [],
};