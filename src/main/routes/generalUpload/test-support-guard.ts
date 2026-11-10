const ALLOWED_TEST_SUPPORT_ENVS = new Set(['local', 'test']);

function getRuntimeEnv(): string {
  return process.env.NODE_ENV || 'development';
}

export function isTestSupportRoutesEnabled(): boolean {
  return process.env.ENABLE_TEST_SUPPORT_ROUTES === 'true';
}

export function assertTestSupportRoutesStartupGuard(): void {
  if (!isTestSupportRoutesEnabled()) {
    return;
  }

  const env = getRuntimeEnv();
  if (!ALLOWED_TEST_SUPPORT_ENVS.has(env)) {
    throw new Error(
      `ENABLE_TEST_SUPPORT_ROUTES=true is not allowed in "${env}". Allowed environments: local, development, test, preview, aat.`
    );
  }

  const secret = process.env.TEST_SUPPORT_ROUTE_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('ENABLE_TEST_SUPPORT_ROUTES=true requires TEST_SUPPORT_ROUTE_SECRET to be set.');
  }
}

export function isValidTestSupportSecretHeader(headerValue: string | undefined): boolean {
  const expected = process.env.TEST_SUPPORT_ROUTE_SECRET;
  if (!expected) {
    return false;
  }

  return headerValue === expected;
}
