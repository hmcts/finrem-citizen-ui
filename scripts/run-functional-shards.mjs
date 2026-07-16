import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const shardTotal = Number.parseInt(process.env.PLAYWRIGHT_SHARD_TOTAL || '10', 10);
const retryCount = Number.parseInt(process.env.PLAYWRIGHT_RETRIES || '2', 10);
const resultsRoot = process.env.TEST_RESULTS_DIR || 'functional-output';
const blobReportsRoot = path.join(resultsRoot, 'all-blob-reports');
const installInScript = (process.env.PLAYWRIGHT_INSTALL_IN_SCRIPT || 'true') === 'true';

// Determine if we are running on Windows to handle the Yarn executable properly
const isWindows = os.platform() === 'win32';
const yarnCmd = isWindows ? 'yarn.cmd' : 'yarn';

// Instead of wiping out the PATH, we inherit the system's PATH to keep node/nvm intact
const buildChildEnv = overrides => ({
  ...process.env,
  ...overrides,
});

if (!Number.isFinite(shardTotal) || shardTotal < 1) {
  throw new Error(`Invalid PLAYWRIGHT_SHARD_TOTAL value: ${process.env.PLAYWRIGHT_SHARD_TOTAL}`);
}

console.log(`Running functional sharding with ${shardTotal} shards and ${retryCount} retries.`);

// Clean up previous runs
await rm(resultsRoot, { recursive: true, force: true });
await rm('playwright-report', { recursive: true, force: true });
await mkdir(resultsRoot, { recursive: true });

if (installInScript) {
  execFileSync(yarnCmd, ['playwright', 'install', '--with-deps', 'chromium'], {
    stdio: 'inherit',
    env: buildChildEnv(),
    shell: isWindows, // Critical for Windows support
  });
}

const runShard = shardIndex => new Promise(resolve => {
  const shardResultsDir = path.join(resultsRoot, `shard-${shardIndex}`);
  const shardEnv = {
    ...buildChildEnv(),
    PLAYWRIGHT_CI_SHARDED: 'true',
    PLAYWRIGHT_WORKERS: process.env.PLAYWRIGHT_WORKERS || '1',
    PLAYWRIGHT_RETRIES: String(retryCount),
    TEST_RESULTS_DIR: shardResultsDir,
  };

  const child = spawn(
    yarnCmd,
    [
      'playwright',
      'test',
      '--config',
      'playwright.config.mts',
      '--project',
      'chromium',
      `--shard=${shardIndex}/${shardTotal}`,
      `--retries=${retryCount}`,
    ],
    {
      env: shardEnv,
      stdio: 'inherit',
      shell: isWindows, // Critical for Windows support
    }
  );

  child.on('close', code => {
    resolve({ code, shardIndex, shardResultsDir });
  });
});

// Run shards
const shardRuns = [];
for (let shardIndex = 1; shardIndex <= shardTotal; shardIndex += 1) {
  shardRuns.push(runShard(shardIndex));
}

const shardResults = await Promise.all(shardRuns);
const shardFailed = shardResults.some(result => result.code !== 0);

// Set up blob reports directory
await rm(blobReportsRoot, { recursive: true, force: true });
await mkdir(blobReportsRoot, { recursive: true });

for (const result of shardResults) {
  const shardBlobReportDir = path.join(result.shardResultsDir, 'blob-report');
  try {
    const blobEntries = await readdir(shardBlobReportDir);
    for (const entry of blobEntries) {
      await cp(
        path.join(shardBlobReportDir, entry),
        path.join(blobReportsRoot, `shard-${result.shardIndex}-${entry}`),
        { recursive: true }
      );
    }
  } catch (err) {
    // Only swallow the error if the folder actually doesn't exist (expected for failed runs)
    if (err.code !== 'ENOENT') {
      console.warn(`Failed to copy blob report for shard ${result.shardIndex}:`, err.message);
    }
  }
}

const mergedInputEntries = await readdir(blobReportsRoot);
if (mergedInputEntries.length === 0) {
  console.warn(`No shard blob reports found under ${blobReportsRoot}; skipping report merge.`);
} else {
  console.log(`Merging ${mergedInputEntries.length} blob report file(s) from ${blobReportsRoot}.`);

  // Merge reports
  try {
    execFileSync(
      yarnCmd,
      ['playwright', 'merge-reports', '--reporter', 'html', blobReportsRoot],
      {
        stdio: 'inherit',
        env: buildChildEnv(),
        shell: isWindows,
      }
    );
  } catch (error) {
    if (!shardFailed) {
      throw error;
    }
  }
}

if (shardFailed) {
  process.exitCode = 1;
}