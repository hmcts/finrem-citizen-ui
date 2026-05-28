# Test Guide (Single Source Of Truth)

This file is the single source of truth for test execution guidance and test logic conventions in this repository.
It is located under `specFiles/` for historical reasons, but it covers the full test operating model in `src/test` (unit, routes, API, smoke, and functional).

## What Is Tested In This Repo

### Unit tests (`src/test/unit/`)
- Validate business logic, middleware, modules, scripts, views, and utility functions.
- Fastest feedback for low-level behavior changes.

### Route tests (`src/test/routes/`)
- Validate route registration, redirect behavior, health paths, and upload-journey/task-list route behavior.
- Focus on application routing contracts and guards.

### API tests (`src/test/api/`)
- Validate endpoint behavior and multi-step API workflows using Jest + Supertest.
- Includes endpoint-level, workflow-level, and mock API coverage.

### Smoke tests (`src/test/smoke/`)
- Validate service readiness and core route availability.
- Minimal confidence checks for environment health.

### Functional tests (`src/test/functional/`)
- Validate browser-based user journeys with Playwright.
- Includes mock and integration lanes, POM-based interactions, shared fixtures, and journey helpers.

### Accessibility coverage
- Validated in functional runs via `@hmcts/playwright-common` (`AxeUtils`) plus accessibility-tree proxy assertions.
- Focused accessibility-only runs use `test:playwright:a11y:*` scripts.

## Scope

Functional tests are split into:

- mock: Local-only tests that use mock infrastructure and test-support routes.
- integration: Cross-environment tests (local, preview, AAT) that use real API flows.

Folder layout:

```text
specFiles/
├── mock/
├── integration/
├── journeyHelpers/
└── README.md
```

## `src/test` Overview

This guide also covers how the wider `src/test` tree supports functional testing:

| Path | Purpose |
|---|---|
| `src/test/api/` | API-level Jest and Supertest coverage, split into `endpoints/`, `workflows/`, and `mocks/`. Useful alongside functional runs when validating backend-facing flows. |
| `src/test/functional/specFiles/` | Playwright spec files, split into `mock/` and `integration/`, with `journeyHelpers/` for shared orchestration. |
| `src/test/functional/pom/` | Page Object Models and shared page components used by Playwright journeys. |
| `src/test/functional/utils/` | Functional support code including helpers, factories, API utilities, payload builders, and reusable test-data generation. |
| `src/test/fixtures/fixtures.ts` | Shared Playwright fixtures for login/session setup and automatic accessibility auditing. |
| `src/test/routes/` | Jest route checks for entry points, redirects, health, task-list upload flow, and test-support routes. |
| `src/test/smoke/` | Minimal smoke coverage for route and service readiness. |
| `src/test/unit/` | Unit-level Jest coverage for modules, middleware, route handlers, scripts, upload journey logic, views, and utility functions. |
| `src/test/data/` | Shared static test data used across test suites. |
| `src/test/config.ts` | Shared test configuration defaults for target URL, headless mode, and timing values. |

Use this split in practice:

- `src/test/unit/`, `src/test/routes/`, and `src/test/api/` for fast Jest-based feedback.
- `src/test/functional/` for browser journeys, shared fixtures, helpers, factories, and accessibility coverage.
- `src/test/smoke/` for minimal deployment-confidence checks.

## `src/test/functional/utils` Overview

This area contains reusable functional-test logic for API setup, case creation, assertions, and test payload shaping.

### Folder Structure

| Path | Purpose |
|---|---|
| `src/test/functional/utils/api/` | API clients for journey-specific backend operations (for example contested-case event calls). |
| `src/test/functional/utils/factories/` | Higher-level test-data/case factories that compose API calls into reusable setup flows. |
| `src/test/functional/utils/helpers/` | Shared helper functions for HTTP calls, token handling, case creation, assertions, and POM assertion helpers. |
| `src/test/functional/utils/test_data/` | Test-data configuration and payload transformation utilities (including JSON payload templates). |

### Top-Level Utility Files

| File | Purpose |
|---|---|
| `src/test/functional/utils/CaseDataBuilder.ts` | Builder-style helper for assembling case data payloads used by functional setup flows. |
| `src/test/functional/utils/DateHelper.ts` | Centralized date/time helper utilities for stable test date values. |
| `src/test/functional/utils/PayloadMutator.ts` | Reusable payload replacement rules/functions used to tailor JSON payloads for scenarios. |

### Helpers (File-by-File)

| File | Purpose |
|---|---|
| `src/test/functional/utils/helpers/ApiHelper.ts` | Axios wrapper helpers (`apiGet`, `apiPost`) with retry/error handling for test API calls. |
| `src/test/functional/utils/helpers/CcdApi.ts` | CCD API client wrapper for case/event interactions used in functional setup and workflows. |
| `src/test/functional/utils/helpers/TokenHelperApi.ts` | Service/user token acquisition and token-cache management helpers. |
| `src/test/functional/utils/helpers/caseCreation.ts` | Creates/configures cases for tests and contains case-creation orchestration logic. |
| `src/test/functional/utils/helpers/idamCreateUser.ts` | IDAM test-user creation helpers for functional authentication setup. |
| `src/test/functional/utils/helpers/assertionHelpers.ts` | Generic assertion helper factory used across functional tests/fixtures. |
| `src/test/functional/utils/helpers/pomAssertions.ts` | Reusable POM assertion helpers (visibility, attributes, validation errors). |
| `src/test/functional/utils/helpers/testData.ts` | Shared test-data factories/constants (including common error message values). |

### Factories And Test Data (File-by-File)

| File | Purpose |
|---|---|
| `src/test/functional/utils/factories/contested/ContestedCaseFactory.ts` | Factory for creating/preparing contested cases, including hearing setup paths. |
| `src/test/functional/utils/api/contested/ContestedEventApi.ts` | API helper for contested-case event execution used by contested factory/setup logic. |
| `src/test/functional/utils/test_data/EnvTestDataConfig.ts` | Environment-aware test-data configuration values used by payload setup. |
| `src/test/functional/utils/test_data/JsonEnvValReplacer.ts` | Replaces placeholder values in JSON payload templates using environment/test config. |
| `src/test/functional/utils/test_data/payloads/contested/*.json` | Raw contested-case payload templates used as base inputs for factory/setup flows. |

## Rules By Test Type

### Mock tests

Use when validating UI behavior with deterministic, injected session data.

Required:

- Mock CCD API running on http://localhost:4100
- App started with ENABLE_TEST_SUPPORT_ROUTES=true
- test.use({ useMockTestSupport: true }) when using test-support routes
- injectCaseSession() only in mock tests

### Integration tests

Use when validating real integration behavior.

Required:

- Reachable CCD (local mock CCD, preview, or AAT)
- ACCESS_CODE_REAL_INTEGRATION=true
- No test-support route injection

Default behavior:

- Real happy-path suites are commonly gated and may be skipped unless integration mode is explicitly enabled.

## Environment Variables

- ACCESS_CODE_REAL_INTEGRATION:
  - false (default): integration-happy-path suites skipped
  - true: integration-happy-path suites enabled
- ENABLE_TEST_SUPPORT_ROUTES:
  - true: test-support endpoints enabled (local mock flow)
  - false: test-support endpoints disabled (preview/AAT default)

Root .env target selection must define one active target block:

- local
- preview
- aat

Set values for:

- CCD_URL
- CCD_DATA_STORE_API_URL

Target selection in `.env` sets which environment Playwright and the app point at. It does not enable integration or mock-only behavior by itself.

- For preview/AAT integration behavior, set `ACCESS_CODE_REAL_INTEGRATION=true`.
- For local mock-only suites, keep `ENABLE_TEST_SUPPORT_ROUTES=true` and the mock API running.

## Running Tests

### Local mock flow

```bash
# Terminal 1
yarn start:mock-case-api

# Terminal 2
ENABLE_TEST_SUPPORT_ROUTES=true yarn start:dev

# Terminal 3
yarn test:functional
```

### Preview or AAT flow

```bash
# Select target in .env first (RUNNING_ENV=pr-xxx or RUNNING_ENV=aat),
# or set TEST_URL directly for an explicit deployed target.
ACCESS_CODE_REAL_INTEGRATION=true yarn test:functional
```

For preview/AAT runs, do not start the app locally with `yarn start:dev`.
Playwright targets the deployed environment directly when baseURL is non-localhost.

## Targeted Runs

```bash
# Mock folder only
yarn test:functional -- src/test/functional/specFiles/mock/

# Integration folder only
ACCESS_CODE_REAL_INTEGRATION=true yarn test:functional -- src/test/functional/specFiles/integration/

# Tag filtering
yarn test:functional -- --grep "\[mock\]"
ACCESS_CODE_REAL_INTEGRATION=true yarn test:functional -- --grep "\[integration\]"

# Single spec
yarn test:functional -- src/test/functional/specFiles/integration/fdr.integration.spec.ts
```

## Script Reference

Commands are defined in [../../../../package.json](../../../../package.json).

### Script Matrix By Environment

| Script | Local | Local mock flow | Preview/AAT | Purpose |
|---|---|---|---|---|
| yarn test:functional | Yes | Yes | Yes (with ACCESS_CODE_REAL_INTEGRATION=true) | Main functional run on Chromium with retries; installs Playwright deps; includes @a11y-tagged tests |
| yarn test:full-functional | Yes | Yes | Yes | Faster repeat functional run on Chromium (no Playwright install step) |
| yarn test:functional:all-browsers | Yes | Yes | Yes | Cross-browser run (Chromium, Firefox, WebKit); includes @a11y-tagged tests |
| yarn test:functional:pr | Yes | Yes | Yes | PR-tagged functional tests only (@PR) |
| yarn test:functional:headed:slowmo | Yes | Yes | Yes | Interactive debugging with headed Chromium + Playwright inspector against the selected target |
| yarn test:fullfunctional:allBrowsers:ui | Yes | Yes | Yes | Playwright UI mode for interactive debugging against the selected target |
| yarn test:playwright:a11y:chrome | Yes | Yes | Yes | Accessibility-tagged tests on Chromium |
| yarn test:playwright:a11y:all-browsers | Yes | Yes | Yes | Accessibility-tagged tests on all browsers + report |
| yarn qacichecks | Yes | Yes | Yes | Broadest single-script QA gate: build, lint, unit, route, API, coverage, and functional tests on Chromium |

`Local` means `.env` target selection points to `local`.
`Local mock flow` means local target plus mock API + `ENABLE_TEST_SUPPORT_ROUTES=true` for mock-suite behavior.

### Best Practice Run Order

Use this sequence for reliable feedback before pushing:

1. Fast local confidence:
   - yarn test:full-functional - Chromium only
2. Cross-browser confidence (before merge/release):
   - yarn test:functional:all-browsers - Chromium, Firefox, and WebKit
3. Isolated accessibility-only pass (when you only want @a11y coverage):
   - yarn test:playwright:a11y:chrome - Chromium only
   - optionally yarn test:playwright:a11y:all-browsers - Chromium, Firefox, and WebKit
4. Debug any failures interactively:
   - yarn test:functional:headed:slowmo - Chromium only
   - optionally yarn test:fullfunctional:allBrowsers:ui - interactive Playwright UI with browser selection in the runner
5. Final pre-push gate:
   - yarn qacichecks - best single script to run before push because it combines build, lint, unit tests, route tests, API tests, coverage, and the Chromium functional run

If you are only running one script before pushing code, use `yarn qacichecks`.

## Accessibility Conventions

- Functional UI behavior should include accessibility coverage unless explicitly out of scope.
- Add @a11y in test names when accessibility is asserted.
- WCAG coverage: automated checks target WCAG 2.0, 2.1, and 2.2 at Level A and AA via axe rule tags from playwright-common defaults (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22a, wcag22aa).
- Implementation in this repo uses @hmcts/playwright-common as follows:
  - src/test/fixtures/fixtures.ts creates AxeUtils from @hmcts/playwright-common.
  - src/test/functional/specFiles/journeyHelpers/specAssertions.helper.ts runs axeUtils.audit(DEFAULT_AXE_OPTIONS).
  - DEFAULT_AXE_OPTIONS currently disables only target-size (WCAG 2.5.8) due to GOV.UK Frontend component behavior.
- Use in tests/helpers:

```typescript
await axeUtils.audit(DEFAULT_AXE_OPTIONS);
```

- `runA11yAudit(...)` behavior (in `journeyHelpers/specAssertions.helper.ts`):
   - Runs `axeUtils.audit(DEFAULT_AXE_OPTIONS)` to execute WCAG rule checks.
   - Resolves which Playwright `page` to inspect (`explicitPage` when provided, otherwise AxeUtils page).
   - Captures `ariaSnapshot()` from `main` (or `body` fallback) as an accessibility-tree assertion.
   - Asserts the snapshot exists with `expect(ariaSnapshot).toBeTruthy()` as a screen-reader proxy guard.
   - Sets `A11Y_AUDIT_MARKER` to avoid duplicate audits for the same page state.

- Auto accessibility audit runs via fixtures and should remain enabled unless there is a documented reason to opt out.

## Labeling Conventions

- [mock]: local mock-only suites
- [integration]: integration suites
- [integration-happy-path]: real integration happy-path scenarios

## Troubleshooting

### Missing test-support route errors

Cause:

- Mock API not running, or ENABLE_TEST_SUPPORT_ROUTES not set

Fix:

```bash
yarn start:mock-case-api
ENABLE_TEST_SUPPORT_ROUTES=true yarn start:dev
yarn test:functional -- src/test/functional/specFiles/mock/
```

### Integration suites skipped

Cause:

- ACCESS_CODE_REAL_INTEGRATION is not true, or suite-level feature gate remains active

Fix:

```bash
export ACCESS_CODE_REAL_INTEGRATION=true
yarn test:functional -- src/test/functional/specFiles/integration/
```

### CCD not reachable

Cause:

- Incorrect CCD_URL or CCD_DATA_STORE_API_URL

Fix:

```bash
echo $CCD_URL
echo $CCD_DATA_STORE_API_URL
```

## Maintenance Notes

- Keep this guide concise and focused on conventions and run commands.
- Keep spec-level implementation details inside spec files and helper modules.
- If scripts change in package.json, update this file in the same PR.
