const ALLOWED_TEST_SUPPORT_ENVS = new Set(['local', 'test']);

export function assertTestSupportRoutesStartupGuard(): void {
  if (!areTestSupportRoutesEnabled()) {
    return;
  }

  const env = getRuntimeEnv();
  if (!ALLOWED_TEST_SUPPORT_ENVS.has(env)) {
    throw new Error(
      `ENABLE_TEST_SUPPORT_ROUTES=true is not allowed in "${env}". Allowed environments: local, test.`
    );
  }

  const secret = process.env.TEST_SUPPORT_ROUTE_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('ENABLE_TEST_SUPPORT_ROUTES=true requires TEST_SUPPORT_ROUTE_SECRET to be set.');
  }
}

export function areTestSupportRoutesEnabled(): boolean {
  return process.env.ENABLE_TEST_SUPPORT_ROUTES === 'true';
}

export function isValidTestSupportSecretHeader(headerValue: string | undefined): boolean {
  const expected = process.env.TEST_SUPPORT_ROUTE_SECRET;
  if (!expected) {
    return false;
  }

  return headerValue === expected;
}

function getRuntimeEnv(): string {
  return process.env.NODE_ENV || 'development';
}
