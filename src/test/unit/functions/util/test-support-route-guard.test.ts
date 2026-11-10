import { beforeEach, describe, expect, test } from '@jest/globals';

import {
  areTestSupportRoutesEnabled,
  assertTestSupportRoutesStartupGuard,
  isValidTestSupportSecretHeader,
} from '../../../../main/functions/util/test-support-route-guard';

describe('test-support-route-guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_TEST_SUPPORT_ROUTES = 'true';
    process.env.TEST_SUPPORT_ROUTE_SECRET = 'local-functional-secret';
  });

  test('returns true when test-support routes are enabled', () => {
    expect(areTestSupportRoutesEnabled()).toBe(true);
  });

  test('throws when enabled outside allowed envs', () => {
    process.env.NODE_ENV = 'production';

    expect(() => assertTestSupportRoutesStartupGuard()).toThrow(
      'ENABLE_TEST_SUPPORT_ROUTES=true is not allowed in "production". Allowed environments: local, test.'
    );
  });

  test('throws when secret is missing', () => {
    delete process.env.TEST_SUPPORT_ROUTE_SECRET;

    expect(() => assertTestSupportRoutesStartupGuard()).toThrow(
      'ENABLE_TEST_SUPPORT_ROUTES=true requires TEST_SUPPORT_ROUTE_SECRET to be set.'
    );
  });

  test('accepts matching secret header', () => {
    expect(isValidTestSupportSecretHeader('local-functional-secret')).toBe(true);
  });

  test('rejects non-matching secret header', () => {
    expect(isValidTestSupportSecretHeader('wrong-secret')).toBe(false);
  });
});
