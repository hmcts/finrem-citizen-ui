import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { globSync } from 'glob';

const shardTotal = Number.parseInt(process.env.PLAYWRIGHT_SHARD_TOTAL || '8', 10);
const retryCount = Number.parseInt(process.env.PLAYWRIGHT_RETRIES || '2', 10);
const resultsRoot = process.env.TEST_RESULTS_DIR || 'functional-output';
const blobReportsRoot = path.join(resultsRoot, 'all-blob-reports');
const installInScript = (process.env.PLAYWRIGHT_INSTALL_IN_SCRIPT || 'true') === 'true';

console.log(
  `[functional-ci] shardTotal=${shardTotal} retryCount=${retryCount} installInScript=${installInScript}`
);

// Determine if we are running on Windows to handle the Yarn executable properly
const isWindows = os.platform() === 'win32';
const yarnCmd = isWindows ? 'yarn.cmd' : 'yarn';

// Instead of wiping out the PATH, we inherit the system's PATH to keep node/nvm intact
const buildChildEnv = overrides => ({
  ...process.env,
  ...overrides,
});

const canLaunchChromium = async () => {
  try {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return !message.includes("Executable doesn't exist");
  }
};

if (!Number.isFinite(shardTotal) || shardTotal < 1) {
  throw new Error(`Invalid PLAYWRIGHT_SHARD_TOTAL value: ${process.env.PLAYWRIGHT_SHARD_TOTAL}`);
}

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
} else {
  const chromiumAvailable = await canLaunchChromium();
  if (!chromiumAvailable) {
    console.warn(
      '[functional-ci] Chromium binary not found while PLAYWRIGHT_INSTALL_IN_SCRIPT=false. Installing chromium fallback...'
    );
    execFileSync(yarnCmd, ['playwright', 'install', 'chromium'], {
      stdio: 'inherit',
      env: buildChildEnv(),
      shell: isWindows,
    });
  }
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
    const blobFiles = globSync('**/*', {
      cwd: shardBlobReportDir,
      nodir: true,
      absolute: false,
    });

    for (const relativeFile of blobFiles) {
      const sourcePath = path.join(shardBlobReportDir, relativeFile);
      const targetFileName = `shard-${result.shardIndex}-${path.basename(relativeFile)}`;
      const targetPath = path.join(blobReportsRoot, targetFileName);
      await cp(sourcePath, targetPath, { recursive: false });
    }
  } catch (err) {
    // Only swallow the error if the folder actually doesn't exist (expected for failed runs)
    if (err.code !== 'ENOENT') {
      console.warn(`Failed to copy blob report for shard ${result.shardIndex}:`, err.message);
    }
  }
}

const mergedInputFiles = globSync('**/*', {
  cwd: blobReportsRoot,
  nodir: true,
  absolute: false,
});

if (mergedInputFiles.length === 0) {
  console.warn(`[functional-ci] No blob files found under ${blobReportsRoot}; skipping report merge.`);
}

// Merge reports
try {
  if (mergedInputFiles.length > 0) {
    execFileSync(
      yarnCmd,
      ['playwright', 'merge-reports', '--reporter', 'html', blobReportsRoot],
      {
        stdio: 'inherit',
        env: buildChildEnv(),
        shell: isWindows,
      }
    );
  }
} catch (error) {
  if (!shardFailed) {
    throw error;
  }
}

if (shardFailed) {
  process.exitCode = 1;
}