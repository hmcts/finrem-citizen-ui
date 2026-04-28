process.env.ALLOW_CONFIG_MUTATIONS = 'true';

module.exports = {
  roots: ['<rootDir>/src/test/routes'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',

  moduleNameMapper: {
    '^router/(.*)$': '<rootDir>/src/main/router/$1',
    '^routes/(.*)$': '<rootDir>/src/main/routes/$1',
  },

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
    '^.+\\.m?js$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]],
      },
    ],
  },
transformIgnorePatterns: [
  String.raw`/node_modules/(?!(openid-client|oauth4webapi|jose|otplib|@otplib|@scure|@noble|uuid|@azure|@hmcts)/)`,
],  
  setupFiles: ['<rootDir>/src/test/jest.routes.env.setup.ts'],
};
