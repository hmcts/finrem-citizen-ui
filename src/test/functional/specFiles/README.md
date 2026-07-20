# Test Guide (Single Source Of Truth)

This file is the single source of truth for test execution guidance and test logic conventions in this repository.
It is located under `specFiles/` for historical reasons, but it covers the full test operating model in `src/test` (unit, routes, API, smoke, and functional).

## Jenkins Builds

- **Nightly runs**: https://build.hmcts.net/job/HMCTS_d_to_i_Nightly/job/finrem-citizen-ui/job/master/
- **Master build runs**: https://build.hmcts.net/job/HMCTS_d_to_i/job/finrem-citizen-ui/job/master/
- **Preview (PR) build runs**: https://build.hmcts.net/job/HMCTS_d_to_i/job/finrem-citizen-ui/job/PR-437/ (replace 437 with your PR number)

## What Is Tested In This Repo

### Which test should I add for a given type of change?

| Change type | Primary test to add | Secondary checks |
|---|---|---|
| Pure business logic or utility function | Unit test in `src/test/unit/` | Route/API tests only if route contract changes |
| New/changed route guard, redirect, validation branch | Route test in `src/test/routes/` | Unit test for helper logic used by route |
| Endpoint contract or workflow orchestration | API test in `src/test/api/` | Route test if rendered page or redirect changes |
| Browser journey behavior (content, interaction, navigation) | Functional test in `src/test/functional/specFiles/` | Add/update POM methods first, then use them in specs |
| Route availability/redirect sanity for deployments | Smoke test in `src/test/smoke/smoke.ts` | None unless behavior expands beyond smoke intent |
| UI copy/layout/content with user impact | Functional test + `@a11y` assertion | Add route test if server-side validation/redirect also changed |

### Which commands should I run before pushing?

Minimum high-confidence gate:

```bash
yarn qacichecks
```

If iterating quickly, use this order:

```bash
yarn test
yarn test:routes
yarn test:api
yarn test:functional
```

### Which tests give confidence in auth, CCD linking, and document journeys?

- Auth/session wiring confidence: integration functional specs plus API token/setup helpers.
- CCD linking/access-code confidence: integration suites in `enterAccessCode.integration.spec.ts` with polling controls.
- Document journey confidence: integration suites around selection/upload/check-upload/send-to-other-party and related route tests.

### How do I debug failing Playwright tests quickly?

```bash
yarn test:functional:headed:slowmo -- src/test/functional/specFiles/integration/<file>.integration.spec.ts
```

Then narrow by test title:

```bash
yarn test:functional:headed:slowmo -- src/test/functional/specFiles/integration/<file>.integration.spec.ts --grep "<test title fragment>"
```

## Overall Testing Strategy

- Use a pyramid approach: many fast unit/route/API checks, fewer browser integration tests, and minimal smoke checks.
- Keep functional specs focused on journey orchestration; keep locator and interaction detail inside POMs.
- Prefer deterministic local mock tests for UI behavior and integration tests for real environment confidence.
- Treat accessibility assertions as part of normal functional test quality, not a separate optional pass.

### Unit tests (`src/test/unit/`)
- Validate business logic, middleware, modules, scripts, views, and utility functions.
- Fastest feedback for low-level behavior changes.
- Default command: `yarn test` (runs `yarn test:unit` outside CI).
- Coverage enforcement is set in `jest.config.js` with global thresholds at 85% for statements, branches, functions, and lines.

### Route tests (`src/test/routes/`)
- Validate route registration, redirect behavior, health paths, and general upload/task-list route behavior.
- Focus on application routing contracts and guards.
- Typical proof points:
   - route protection/auth redirects
   - validation errors and continuation flow
   - expected rendered page/view model wiring

### API tests (`src/test/api/`)
- Validate endpoint behavior and multi-step API workflows using Jest + Supertest.
- Includes endpoint-level, workflow-level, and mock API coverage.
- Command: `yarn test:api`.
- Mocked vs real:
   - API tests execute against the app/test harness process and helper-level stubs/mocks.
   - Functional integration tests provide cross-service confidence against selected deployed targets.

### Smoke tests (`src/test/smoke/`)
- Validate service readiness and core route availability.
- Minimal confidence checks for environment health.
- Command: `yarn test:smoke`.
- Smoke tests prove route/service availability and expected redirect behavior for protected routes.
- Smoke tests do not prove end-to-end business workflows, CCD data mutations, or full browser journey correctness.

### Functional tests (`src/test/functional/`)
- Validate browser-based user journeys with Playwright.
- Includes mock and integration lanes, POM-based interactions, shared fixtures, and journey helpers.
- Command: `yarn test:functional`.
- Structure:
   - specs under `specFiles/mock` and `specFiles/integration`
   - page logic under `pom/`
   - shared orchestration in `specFiles/journeyHelpers/`
   - reusable API/setup helpers under `utils/helpers/` and `utils/factories/`

### Accessibility coverage
- Validated in functional runs via `@hmcts/playwright-common` (`AxeUtils`) plus accessibility-tree proxy assertions.
- Focused accessibility-only runs use `test:playwright:a11y:*` scripts.
- Expected when UI changes:
   - keep or add `@a11y` coverage on affected journeys
   - run relevant functional spec(s) and verify no axe regressions
   - run broader a11y scripts when shared templates/layouts are changed

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

## QA Checks And Common Commands

These are the commands most developers should use in day-to-day change validation:

- `yarn test`: unit tests (outside CI) for quick logic confidence.
- `yarn test:routes`: route contracts (protection, redirects, validation navigation).
- `yarn test:api`: API-level endpoint/workflow coverage.
- `yarn test:functional`: Playwright Chromium journey coverage (includes `@a11y` tests present in the selected set).
- `yarn qacichecks`: best single pre-push gate (build, lint, unit, routes, API, coverage, functional).

Optional comprehensive browser gate:

- `yarn qacichecks:allBrowsers`

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
- No test-support route injection

Default behavior:

- Real happy-path suites run by default on preview/AAT targets.
- Outside preview/AAT, set ACCESS_CODE_REAL_INTEGRATION=true to enable them.

## Environment Variables

- ACCESS_CODE_REAL_INTEGRATION:
   - true: integration-happy-path suites enabled for any target
   - false: treated as local default; preview/AAT still run integration-happy-path suites
- Access-code polling tuning (real integration happy-path):
   - ACCESS_CODE_MAX_TOTAL_RUNTIME_MS (default: 30000)
   - ACCESS_CODE_FETCH_ATTEMPTS_PER_CASE (default: 0, meaning timebox-until-deadline)
   - ACCESS_CODE_FETCH_INITIAL_DELAY_MS (default: 500)
   - ACCESS_CODE_FETCH_MAX_DELAY_MS (default: 2000)
   - ACCESS_CODE_CASE_CREATION_ATTEMPTS (default: 1)
   - ACCESS_CODE_MANAGE_HEARINGS_REATTEMPTS (default: 0)
- ENABLE_TEST_SUPPORT_ROUTES:
  - true: test-support endpoints enabled (local mock flow)
  - false: test-support endpoints disabled (preview/AAT default)
- CCD logging controls:
   - CCD_LOG_PROGRESS=true enables create/update progress logs (default: quiet)
   - CCD_VERBOSE_RETRY=true enables verbose retry/fallback logs (default: quiet locally, summarized in CI)

Root .env target selection must define one active target block:

- local
- preview
- aat

Set values for:

- CCD_URL
- CCD_DATA_STORE_API_URL

Target selection in `.env` sets which environment Playwright and the app point at. It does not enable integration or mock-only behavior by itself.

- Preview/AAT targets run integration happy-path suites by default.
- For non-preview/non-AAT targets, set `ACCESS_CODE_REAL_INTEGRATION=true` to enable integration happy-path suites.
- For local mock-only suites, keep `ENABLE_TEST_SUPPORT_ROUTES=true` and the mock API running.

## How Playwright Selects The Target Environment

The selection order is:

1. `TEST_URL` if set
2. `RUNNING_ENV` if `TEST_URL` is empty
3. default fallback: `aat`

Examples:

- `RUNNING_ENV=local` and no `TEST_URL` points to localhost flow.
- `RUNNING_ENV=pr-423` and no `TEST_URL` points to preview URL pattern.
- `RUNNING_ENV=aat` and no `TEST_URL` points to AAT URL pattern.

Reference implementation is in `playwright.config.mts` (`getBaseUrl()`).

## Local vs Preview vs AAT Execution

- Local:
   - Run app and mock CCD API locally.
   - Use mock suites for deterministic UI behavior.
- Preview:
   - Target deployed PR environment.
   - Integration happy-path suites enabled by default.
- AAT:
   - Target deployed AAT environment.
   - Integration happy-path suites enabled by default.

Important: preview/AAT functional runs should not start a local app server.

## Use Of Mock CCD API In Local Tests

Mock CCD API is used to make local functional tests deterministic and fast.

- Start mock API: `yarn start:mock-case-api`
- Start app with support routes: `ENABLE_TEST_SUPPORT_ROUTES=true yarn start:dev`
- Run tests: `yarn test:functional`

Mock-only suites should use test-support route patterns described in this guide and avoid integration-only data setup paths.

## Access-Code Polling And Eventual Consistency Risks

Real integration flows can observe short CCD propagation delays after case creation/events.

- Symptom: access code not immediately present after `FR_issueApplication`.
- Mitigation: increase polling window and keep diagnostics enabled when debugging.
- Tuning variables are documented in this guide under Environment Variables.

When investigating this class of issue, avoid overfitting sleeps; prefer bounded polling and targeted retries.

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
yarn test:functional
```

For preview/AAT runs, do not start the app locally with `yarn start:dev`.
Playwright targets the deployed environment directly when baseURL is non-localhost.

## Targeted Runs

```bash
# Mock folder only
yarn test:functional -- src/test/functional/specFiles/mock/

# Integration folder only
yarn test:functional -- src/test/functional/specFiles/integration/

# Tag filtering
yarn test:functional -- --grep "\[mock\]"
yarn test:functional -- --grep "\[integration\]"

# Single spec
yarn test:functional -- src/test/functional/specFiles/integration/fdr.integration.spec.ts
```

## Script Reference

Commands are defined in [../../../../package.json](../../../../package.json).

### Script Matrix By Environment

| Script | Local | Local mock flow | Preview/AAT | Purpose |
|---|---|---|---|---|
| yarn test:functional:install-deps | Yes | Yes | Yes | Installs Playwright browser dependencies for first-time setup or runner refresh |
| yarn test:functional | Yes | Yes | Yes | Main functional run on Chromium; includes @a11y-tagged tests |
| yarn test:functional:quick | Yes | Yes | Yes | Chromium-only fast run with retries disabled and no Playwright install step |
| yarn test:functional:allBrowsers | Yes | Yes | Yes | Cross-browser functional run (Chromium, Firefox, WebKit) |
| yarn test:functional:pr | Yes | Yes | Yes | PR-tagged Chromium-only functional tests using the same tuned worker/retry defaults as main Chromium runs |
| yarn test:functional:headed:slowmo | Yes | Yes | Yes | Interactive debugging with headed Chromium + Playwright inspector against the selected target |
| yarn test:functional:allBrowsers:ui | Yes | Yes | Yes | Playwright UI mode for interactive debugging against the selected target |
| yarn test:playwright:a11y:chrome | Yes | Yes | Yes | Accessibility-tagged tests on Chromium |
| yarn test:playwright:a11y:all-browsers | Yes | Yes | Yes | Accessibility-tagged tests on all browsers + report |
| yarn qacichecks | Yes | Yes | Yes | Broadest single-script QA gate: build, lint, unit, route, API, coverage, and functional tests on Chromium |
| yarn qacichecks:allBrowsers | Yes | Yes | Yes | Broad QA gate with cross-browser functional coverage (Chromium, Firefox, WebKit) |

`Local` means `.env` target selection points to `local`.
`Local mock flow` means local target plus mock API + `ENABLE_TEST_SUPPORT_ROUTES=true` for mock-suite behavior.

### Worker Strategy (Speed + Stability)

Worker/retry behavior is controlled by script flags plus Playwright config defaults.

Current effective defaults:

- `PLAYWRIGHT_WORKERS`: default `4` when unset (from `playwright.config.mts`)
- `PLAYWRIGHT_RETRIES`: default `2` for `yarn test:functional` and `yarn test:functional:pr` (script flag)
- `PLAYWRIGHT_RETRIES`: default `3` for `yarn test:functional:allBrowsers` (script flag)
- `PLAYWRIGHT_RETRIES=0` for `yarn test:functional:quick`
- `yarn test:functional:headed:slowmo`: fixed `--workers=1`

Notes:

- Integration tests can emit transient CCD retry/fallback behavior in AAT/preview; this is expected when eventual consistency settles within retry windows.
- Override workers/retries per run when needed for agent size or debugging.

When to override defaults:

- If CI is resource-constrained or shows flake spikes, lower workers temporarily.
- If local hardware is stronger and stable, increase workers for faster feedback.
- `PLAYWRIGHT_WORKERS` controls worker count used by Playwright config.
- For strict performance benchmarking, use `PLAYWRIGHT_RETRIES=0`.

Override examples:

```bash
# Constrain Chromium run for a smaller CI agent
PLAYWRIGHT_WORKERS=3 PLAYWRIGHT_RETRIES=2 yarn test:functional

# Increase parallelism for local feedback
PLAYWRIGHT_WORKERS=6 PLAYWRIGHT_RETRIES=2 yarn test:functional

# Pure speed benchmark with retries disabled
PLAYWRIGHT_RETRIES=0 yarn test:functional

# Enable verbose CCD diagnostics when investigating integration flake
CCD_LOG_PROGRESS=true CCD_VERBOSE_RETRY=true yarn test:functional -- src/test/functional/specFiles/integration/enterAccessCode.integration.spec.ts
```

### Best Practice Run Order

Use this sequence for reliable feedback before pushing:

1. Fast local confidence:
   - yarn test:functional - Chromium only
2. Isolated accessibility-only pass (when you only want @a11y coverage):
   - yarn test:playwright:a11y:chrome - Chromium only
   - optionally yarn test:playwright:a11y:all-browsers - Chromium, Firefox, and WebKit
3. Debug any failures interactively:
   - yarn test:functional:headed:slowmo - Chromium only
   - optionally yarn test:functional:allBrowsers:ui - interactive Playwright UI with browser selection in the runner
4. Final pre-push gate:
   - yarn qacichecks - best single script to run before push because it combines build, lint, unit tests, route tests, API tests, coverage, and the Chromium functional run

If you are only running one script before pushing code, use `yarn qacichecks`.

### Debugging In Slowmo (Single File / Single Test)

Use `yarn test:functional:headed:slowmo` when you want interactive debugging with `PWDEBUG=1` and a 250ms slowmo delay (`PLAYWRIGHT_SLOWMO_MS=250`).

Run one spec file:

```bash
yarn test:functional:headed:slowmo -- src/test/functional/specFiles/integration/fdr.integration.spec.ts
```

Run one specific test by title (or partial title):

```bash
yarn test:functional:headed:slowmo -- src/test/functional/specFiles/integration/fdr.integration.spec.ts --grep "[integration] Continue from FDR"
```

Run one tagged test subset (for example `@a11y`):

```bash
yarn test:functional:headed:slowmo -- --grep "@a11y"
```

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

## Known Flaky Patterns And Debug Approach

There are no permanently accepted flaky tests; failures should be treated as defects until resolved.

Most common transient patterns:

- external auth/setup failures (IDAM/S2S credentials, token setup)
- environment readiness/network DNS issues
- CCD eventual consistency delays in integration scenarios
- brittle selectors or timing races in browser interactions

Recommended debug sequence:

1. Confirm target/env variables are coherent for one environment only.
2. Re-run single failing spec in headed slowmo mode.
3. Re-run with `--grep` narrowed to one failing test.
4. Enable CCD diagnostics (`CCD_LOG_PROGRESS=true`, optionally `CCD_VERBOSE_RETRY=true`).
5. Inspect Playwright trace on first retry before changing waits/selectors.

If failure is setup/auth (for example 401 from S2S lease), fix environment/credentials first; do not add UI retries.

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

- Running outside preview/AAT target without enabling real integration happy-path mode

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

### Access codes not found after FR_issueApplication

Cause:

- CCD eventually-consistent read path has not yet surfaced generated access-code fields, or the target case record was updated but access-code collections are still empty.

Fix:

```bash
# Increase polling window for shared AAT load
export ACCESS_CODE_MAX_TOTAL_RUNTIME_MS=45000

# Optional: keep polling timeboxed (0 = no hard attempt cap)
export ACCESS_CODE_FETCH_ATTEMPTS_PER_CASE=0

yarn test:functional -- src/test/functional/specFiles/integration/enterAccessCode.integration.spec.ts
```

Debug confirmation:

- On failure, the error now includes a non-sensitive `debugSnapshot` showing counts/flags for `applicantAccessCodes` and `respondentAccessCodes` so you can confirm whether codes were generated.

## PR Evidence Expectations

For test-impacting PRs, include:

1. What changed in tests and why (brief summary).
2. Commands run and pass/fail outcome.
3. If a failure remains, why (for example environment issue) and evidence.
4. For UI changes, mention functional/a11y coverage added or updated.
5. For route/validation changes, mention route/unit assertions updated.

Minimum expected command evidence for most code changes:

- `yarn test`
- `yarn test:routes`
- `yarn test:api`
- `yarn test:functional`

For broad or risky changes, prefer `yarn qacichecks` output evidence.

## Current Coverage Gaps (Living List)

- Cross-environment dependency failures (IDAM/S2S/CCD) can obscure product-regression signals in integration runs.
- Some integration journeys still rely on shared-environment timing and can surface eventual-consistency noise.
- API health behavior can vary by environment readiness, requiring careful assertion intent (service health vs dependency health).

Keep this section updated when new blind spots are identified.

## Contractor Recommendations To Strengthen The Suite

1. Add explicit preflight checks for critical env/auth prerequisites before long integration suites.
2. Continue replacing brittle selectors with role-first user-facing locators in POMs.
3. Expand reusable journey helpers where setup/assertion flows repeat across 2+ specs.
4. Keep smoke route list aligned with upload step constants to avoid drift.
5. Track flaky-failure categories with lightweight metrics from CI to prioritize stabilization work.

## Maintenance Notes

- Keep this guide concise and focused on conventions and run commands.
- Keep spec-level implementation details inside spec files and helper modules.
- If scripts change in package.json, update this file in the same PR.
