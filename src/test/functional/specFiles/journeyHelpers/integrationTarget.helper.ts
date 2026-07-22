function isDefaultRealCcdTarget(runningEnv: string, testUrl: string): boolean {
  return (
    runningEnv === 'aat'
    || runningEnv === 'perftest'
    || runningEnv === 'ithc'
    || runningEnv.startsWith('pr-')
    || testUrl.includes('.preview.platform.hmcts.net')
    || testUrl.includes('.aat.platform.hmcts.net')
    || testUrl.includes('.perftest.platform.hmcts.net')
    || testUrl.includes('.ithc.platform.hmcts.net')
  );
}

function isDemoTarget(runningEnv: string, testUrl: string): boolean {
  return runningEnv === 'demo' || testUrl.includes('.demo.platform.hmcts.net');
}

function isLocalTarget(runningEnv: string, testUrl: string): boolean {
  return runningEnv === 'local' || testUrl.includes('localhost') || testUrl.includes('127.0.0.1');
}

export function isLocalMockCcdConfigured(): boolean {
  const configuredCcdUrl = (
    process.env.CCD_URL
    || process.env.CCD_DATA_STORE_API_URL
    || ''
  ).toLowerCase().trim();

  return /https?:\/\/(localhost|127\.0\.0\.1):4100\b/.test(configuredCcdUrl);
}

/**
 * Real CCD-backed integration suites should run by default on preview/AAT/perftest/ithc.
 * They are always skipped on demo.
 * Local runs are enabled when mock CCD is configured (localhost:4100).
 */
export function shouldRunRealCcdIntegrationSuite(): boolean {
  const explicitToggle = process.env.ACCESS_CODE_REAL_INTEGRATION;
  const runningEnv = (process.env.RUNNING_ENV || '').toLowerCase();
  const testUrl = (process.env.TEST_URL || '').toLowerCase();

  // Demo does not support reliable real-CCD happy-path execution in this suite.
  if (isDemoTarget(runningEnv, testUrl)) {
    return false;
  }

  // Local should run full functional coverage when the mock CCD target is configured.
  if (isLocalTarget(runningEnv, testUrl) && isLocalMockCcdConfigured()) {
    return true;
  }

  const isRealCcdTarget = isDefaultRealCcdTarget(runningEnv, testUrl);

  if (explicitToggle === 'true') {
    return true;
  }

  if (explicitToggle === 'false') {
    // Keep legacy behavior: do not block known real-CCD targets.
    return isRealCcdTarget;
  }

  return isRealCcdTarget;
}