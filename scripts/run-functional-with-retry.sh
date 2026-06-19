#!/usr/bin/env bash
set -euo pipefail

run_functional() {
  playwright test --config playwright.config.mts --project chromium --retries="${PLAYWRIGHT_RETRIES:-2}" "$@"
}

if run_functional "$@"; then
  exit 0
fi

if [[ "${CI:-}" == "true" ]]; then
  echo "Functional tests failed. Retrying once in CI..."
  run_functional "$@"
  exit $?
fi

exit 1
