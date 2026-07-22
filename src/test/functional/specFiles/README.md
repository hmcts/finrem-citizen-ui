# Test Guide

This guide explains how testing works in this repo and what to run before opening or approving a PR.
It sits under `specFiles/`, but it covers the whole test setup in `src/test`.

## Contents

- [0. Jenkins Builds](#0-jenkins-builds)
- [1. Overall testing strategy](#1-overall-testing-strategy-for-the-service)
- [2. Unit tests](#2-unit-tests)
- [3. Route tests](#3-route-tests)
- [4. API tests](#4-api-tests)
- [5. Functional tests](#5-functional-tests)
- [6. Smoke tests](#6-smoke-tests)
- [7. Accessibility testing](#7-accessibility-testing)
- [8. QA scripts and commonly used commands](#8-qa-scripts-and-commonly-used-commands)
- [8.1 Linting and formatting checks](#81-linting-and-formatting-checks)
- [9. How Playwright selects the target environment](#9-how-playwright-selects-the-target-environment)
- [10. Environment behavior (local, demo, preview, AAT, perftest, ITHC)](#10-environment-behavior-local-demo-preview-aat-perftest-ithc)
- [11. Use of mock CCD API in local tests](#11-use-of-mock-ccd-api-in-local-tests)
- [11.1 Test-support route gating](#111-test-support-route-gating)
- [11.2 Integration test setup for real CCD flows](#112-integration-test-setup-for-real-ccd-flows)
- [12. Access-code polling and eventual consistency risks](#12-access-code-polling-and-eventual-consistency-risks)
- [13. Known flaky tests and how to debug them](#13-known-flaky-tests-and-how-to-debug-them)
- [13.1 Known environment issues: perftest and ITHC](#131-known-environment-issues-perftest-and-ithc)
- [14. What test evidence should be expected in a PR](#14-what-test-evidence-should-be-expected-in-a-pr)
- [15. Gaps in current test coverage](#15-gaps-in-current-test-coverage)
- [16. Contractor recommendations for strengthening the test suite](#16-contractor-recommendations-for-strengthening-the-test-suite)
- [17. Which test should I add for a given type of change?](#17-which-test-should-i-add-for-a-given-type-of-change)
- [18. Which commands should I run before pushing?](#18-which-commands-should-i-run-before-pushing)
- [19. How do I debug failing Playwright tests?](#19-how-do-i-debug-failing-playwright-tests)
- [20. Which tests give confidence in auth, CCD linking and document journeys?](#20-which-tests-give-confidence-in-auth-ccd-linking-and-document-journeys)
- [21. Where is coverage weak today?](#21-where-is-coverage-weak-today)
- [22. src/test overview](#22-srctest-overview)
- [23. Fixtures and how they work](#23-fixtures-and-how-they-work)
- [Appendix A. Environment variables used in testing](#appendix-a-environment-variables-used-in-testing)
- [Appendix B. Script reference highlights](#appendix-b-script-reference-highlights)
- [Maintenance notes](#maintenance-notes)

## 0. Jenkins Builds

- **Nightly runs**: https://build.hmcts.net/job/HMCTS_d_to_i_Nightly/job/finrem-citizen-ui/job/master/
- **Master build runs**: https://build.hmcts.net/job/HMCTS_d_to_i/job/finrem-citizen-ui/job/master/
- **Preview (PR) build runs**: https://build.hmcts.net/job/HMCTS_d_to_i/job/finrem-citizen-ui/job/PR-437/ (replace 437 with your PR number)

Functional runs in Jenkins are sharded by default to reduce runtime. Shards run in parallel, emit per-shard JUnit files under `functional-output/shard-*`, and merge Playwright blob reports into a single HTML report under `playwright-report/`.

## 1. Overall testing strategy

- Use a test pyramid: fast unit/route/API checks, fewer browser integration tests, and a small smoke suite.
- Keep functional specs focused on journey flow, and keep locator and interaction detail in POMs.
- Use local mock tests for predictable UI checks, then integration tests for real-environment behaviour.
- Treat accessibility checks as part of normal UI quality checks.

Test layers:

- `src/test/unit/` for low-level logic correctness.
- `src/test/routes/` for route protection/redirect/validation contracts.
- `src/test/api/` for endpoint and workflow contracts.
- `src/test/functional/` for browser user journeys.
- `src/test/smoke/` for deployment readiness and route availability.

## 2. Unit tests

- Location: `src/test/unit/`.
- Coverage focus: business logic, middleware, modules, scripts, views, and utility functions.
- Fastest feedback loop for low-level changes.
- Default command: `yarn test` (runs `yarn test:unit` outside CI).
- Coverage enforcement in `jest.config.js`:
  - statements: 85
  - branches: 85
  - functions: 85
  - lines: 85

## 3. Route tests

- Location: `src/test/routes/`.
- What they prove:
  - route protection and authentication redirects
  - route-level validation and continuation flow
  - expected rendered page/view behavior for key route states
  - expected route contract behavior
- Command: `yarn test:routes`.

## 4. API tests

- Location: `src/test/api/`.
- What they prove:
  - public/protected endpoint contracts
  - status and header behavior
  - auth and workflow route behavior
  - mock-case-api contract tests
- Command: `yarn test:api`.
- Mocked vs real:
  - API tests run against app/test harness behaviour via Jest + Supertest.
  - Cross-service confidence mostly comes from Playwright integration suites.

## 5. Functional tests

- Location: `src/test/functional/`.
- Command: `yarn test:functional`.
- Folder structure:

```text
src/test/functional/
├── specFiles/
│   ├── mock/
│   ├── integration/
│   └── journeyHelpers/
├── pom/
├── utils/
└── config/
```

- Fixtures and shared behaviour are centralized in [23. Fixtures and how they work](#23-fixtures-and-how-they-work).
- The broader `src/test` split is covered in [22. src/test overview](#22-srctest-overview).
- Journey orchestration belongs in specs/helpers; locator/interaction detail belongs in POM classes.

Scope split:

- `mock`: local-only, deterministic tests using test-support routes.
- `integration`: cross-environment tests that exercise real API flows.

Mock lane guardrails:

- run mock CCD API on `http://localhost:4100`
- start app with `ENABLE_TEST_SUPPORT_ROUTES=true`
- use `test.use({ useMockTestSupport: true })`
- use `injectCaseSession()` only in mock scenarios
- when `injectCaseSession()` is used, place real form-submission calls (`submitCaseNumber`, `submitAccessCode`) in the `else` branch — `injectCaseSession` navigates to `/enter-access-code`, so unconditional form-submission calls after it will time out

Integration lane guardrails:

- use a reachable CCD target (local mock CCD, preview, AAT, perftest, or ITHC)
- do not use test-support route injection
- real CCD-backed integration suites run by default on preview/AAT/perftest/ITHC (including `pr-*` preview targets)
- demo is intentionally hard-skipped for real CCD-backed integration suites
- local skips real CCD-backed suites by default; set `ACCESS_CODE_REAL_INTEGRATION=true` to force them on local

Functional support utilities overview:

| Path | Purpose |
|---|---|
| `src/test/functional/utils/api/` | Journey-specific API clients (for example contested-case events). |
| `src/test/functional/utils/factories/` | Higher-level case/data factories for reusable setup flows. |
| `src/test/functional/utils/helpers/` | Shared helpers for HTTP calls, tokens, case creation, assertions, and POM assertions. |
| `src/test/functional/utils/test_data/` | Environment-aware payload/test-data shaping utilities. |

Top-level utility files:

| File | Purpose |
|---|---|
| `src/test/functional/utils/CaseDataBuilder.ts` | Builder-style helper for assembling case data payloads. |
| `src/test/functional/utils/DateHelper.ts` | Stable date/time utilities for tests. |
| `src/test/functional/utils/PayloadMutator.ts` | Reusable payload replacement rules/functions. |

## 6. Smoke tests

- Location: `src/test/smoke/smoke.ts`.
- Command: `yarn test:smoke`.
- When they run:
  - manually during targeted verification
  - in CI lanes where smoke is configured as a deployment-readiness gate
- What they prove:
  - basic service readiness
  - key route availability
  - expected protected-route redirects
- What smoke does not prove:
  - full business workflow correctness
  - CCD mutation correctness
  - complete browser journey correctness

## 7. Accessibility testing

- Accessibility is built into functional testing.
- Use `@a11y` in test names where accessibility is asserted.
- Implementation:
  - `AxeUtils` from `@hmcts/playwright-common`
  - `runA11yAudit(...)` helper pattern
  - accessibility-tree assertion via `ariaSnapshot()`
- Core call pattern:

```typescript
await axeUtils.audit(DEFAULT_AXE_OPTIONS);
```

- Targeted a11y scripts:
  - `yarn test:playwright:a11y:chrome`
  - `yarn test:playwright:a11y:all-browsers`

Additional conventions:

- Keep accessibility assertions in functional UI tests unless explicitly out of scope.
- Rule tags target WCAG 2.0/2.1/2.2 level A/AA via playwright-common defaults.
- `runA11yAudit(...)` should run `axeUtils.audit(DEFAULT_AXE_OPTIONS)` and perform the accessibility-tree assertion (`ariaSnapshot()`).
- Auto a11y audit via shared fixtures should stay enabled unless there is a documented reason to opt out.

Labeling conventions used in specs:

- `[mock]`: local mock-only suites
- `[integration]`: integration suites
- `[integration-happy-path]`: real integration happy-path scenarios

## 8. QA scripts and commonly used commands

Core commands:

- `yarn test`
- `yarn test:routes`
- `yarn test:api`
- `yarn test:functional`
- `yarn qacichecks`

Best single pre-push check:

```bash
yarn qacichecks
```

Script matrix:

| Script | Local | Local mock flow | Preview/AAT | Purpose |
|---|---|---|---|---|
| `yarn test:functional:install-deps` | Yes | Yes | Yes | Installs Playwright browser dependencies |
| `yarn test:functional` | Yes | Yes | Yes | Main Chromium functional run |
| `yarn test:functional:quick` | Yes | Yes | Yes | Fast Chromium run with retries disabled |
| `yarn test:functional:allBrowsers` | Yes | Yes | Yes | Chromium + Firefox + WebKit |
| `yarn test:functional:pr` | Yes | Yes | Yes | PR-tagged Chromium run |
| `yarn test:functional:headed:slowmo` | Yes | Yes | Yes | Interactive headed debugging |
| `yarn test:functional:allBrowsers:ui` | Yes | Yes | Yes | Playwright UI mode |
| `yarn test:playwright:a11y:chrome` | Yes | Yes | Yes | Accessibility-tagged Chromium run |
| `yarn test:playwright:a11y:all-browsers` | Yes | Yes | Yes | Accessibility-tagged all-browser run |
| `yarn qacichecks` | Yes | Yes | Yes | Build + lint + unit + routes + API + coverage + functional |
| `yarn qacichecks:allBrowsers` | Yes | Yes | Yes | Same as qacichecks with all-browser functional coverage |

Worker/retry defaults and overrides:

- `PLAYWRIGHT_WORKERS`: default `4` when unset (`playwright.config.mts`)
- `PLAYWRIGHT_RETRIES`: default `2` for `test:functional` and `test:functional:pr`
- `PLAYWRIGHT_RETRIES`: default `3` for `test:functional:allBrowsers`
- `PLAYWRIGHT_RETRIES=0` for `test:functional:quick`
- `test:functional:headed:slowmo` runs with `--workers=1`

Useful override examples:

```bash
# Smaller CI agent
PLAYWRIGHT_WORKERS=3 PLAYWRIGHT_RETRIES=2 yarn test:functional

# Faster local feedback
PLAYWRIGHT_WORKERS=6 PLAYWRIGHT_RETRIES=2 yarn test:functional

# Benchmark run without retries
PLAYWRIGHT_RETRIES=0 yarn test:functional

# Verbose CCD diagnostics for integration investigations
CCD_LOG_PROGRESS=true CCD_VERBOSE_RETRY=true yarn test:functional -- src/test/functional/specFiles/integration/enterAccessCode.integration.spec.ts
```

Suggested run order before push:

1. `yarn test:functional`
2. `yarn test:playwright:a11y:chrome` (or all-browsers a11y when needed)
3. `yarn test:functional:headed:slowmo` for investigation if needed
4. `yarn qacichecks` as final gate

## 8.1 Linting and formatting checks

Linting and formatting are enforced both as standalone commands and in pre-commit hooks.

Primary commands:

- `yarn lint` runs ESLint across the repo.
- `yarn lint:fix` runs ESLint with autofix where possible.
- `yarn lint-staged` runs staged-file formatting/lint checks.

Where rules are defined:

- `eslint.config.cjs`
  - flat-config ESLint setup for `*.ts`, `*.tsx`, `*.mts`
  - TypeScript rules such as `no-explicit-any`, `explicit-module-boundary-types`, and `no-unused-vars`
  - import ordering via `eslint-plugin-simple-import-sort`
  - Jest-focused rules via `eslint-plugin-jest`
  - test override that allows `console` in `*.spec.ts`/`*.test.ts`
  - global ignore patterns for generated outputs (for example `functional-output/**`, `playwright-report/**`, and Allure folders)
- `.stylelintrc.json`
  - SCSS/CSS lint baseline via `stylelint-config-standard-scss`
  - project overrides for quote and selector-class constraints
- `package.json` (`lint-staged` section)
  - `prettier --write --ignore-unknown` for all staged files
  - `eslint --fix` for staged `js/ts/mts` files
- `.husky/pre-commit`
  - runs `yarn build`, `yarn test`, and `yarn lint --fix`
  - runs production dependency audit and compares against `yarn-audit-known-issues`
  - blocks commit when `yarn-audit-known-issues` changes until reviewed and staged

Why this matters for test/QA work:

- generated Playwright/Allure artifacts should not be committed or linted; ignore rules prevent false failures
- pre-commit quality gates catch formatting and lint issues before CI
- keeping helper/spec changes lint-clean reduces noisy CI failures when validating test behavior

## 9. How Playwright selects the target environment

Resolution order in `playwright.config.mts` (`getBaseUrl()`):

1. `TEST_URL` if set
2. `RUNNING_ENV` if `TEST_URL` is empty
3. default fallback: `aat`

How URLs are resolved:

- `RUNNING_ENV=pr-xxx` maps to the preview URL pattern
- other env values resolve to `https://finrem-citizen-ui.<env>.platform.hmcts.net`

## 10. Environment behavior (local, demo, preview, AAT, perftest, ITHC)

Local vs preview vs AAT quick view:

- local: fastest deterministic feedback using mock CCD and test-support routes
- preview: real deployed PR environment, real CCD-backed integration suites enabled by default
- AAT: stable shared real environment, real CCD-backed integration suites enabled by default

Local:

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

Mock test rules:

- mock suites use local test-support routes
- use `test.use({ useMockTestSupport: true })`
- use `injectCaseSession()` only for mock scenarios

Local full-suite behavior:

- when `CCD_URL` (or `CCD_DATA_STORE_API_URL`) points to `http://localhost:4100`, integration suites are registered on local
- local integration fixtures use mock-seeded case and access-code data, so local runs do not depend on shared-environment CCD/IDAM/S2S stability
- if local mock prerequisites are not met (CCD URL or test-support route mismatch), affected mock-dependent flows are skipped with an explicit reason

### 11.1 Test-support route gating

Test-support route gating prevents mock-only tests from accidentally running against real/shared environments.

How the gate works:

- mock suites opt in with `test.use({ useMockTestSupport: true })`
- the auto fixture `mockTestSupport` validates that `CCD_URL`/`CCD_DATA_STORE_API_URL` targets local mock CCD (`http://localhost:4100`)
- the same fixture checks that `/__test/inject-case-session` exists and is not returning 404
- if either check fails, tests are skipped with an explicit reason rather than failing mid-journey

Where implemented:

- `src/test/fixtures/fixtures.ts` (`mockTestSupport` auto fixture)
- `src/test/functional/pom/basePage.page.ts` (`injectCaseSession(...)` helper)
- mock suites under `src/test/functional/specFiles/mock/` that declare `useMockTestSupport`

### 11.2 Integration test setup for CCD-backed flows

CCD-backed integration setup supports both shared real environments and local mock-backed execution.

How real-CCD suites are selected:

- `shouldRunRealCcdIntegrationSuite()` controls registration of CCD-backed integration suites
- default enabled targets: preview, AAT, perftest, ITHC (including `pr-*`)
- local is enabled when mock CCD is configured (`CCD_URL`/`CCD_DATA_STORE_API_URL` -> `http://localhost:4100`)
- demo is always skipped for real CCD-backed suites
- local without mock CCD remains skipped to avoid false failures

How integration fixtures prepare data:

- integration specs consume `contestedCaseForCaseNumber` and `contestedCaseWithHearing` fixtures
- on local mock CCD, fixtures return mock-seeded case and access-code data to keep happy-path tests deterministic
- on preview/AAT/perftest/ITHC, fixture setup creates real cases/events via contested case factory helpers before UI assertions begin
- when prerequisites are missing (IDAM user auth, CCD role grants, S2S/CCD reachability), failures occur in setup rather than in page assertions

Where implemented:

- `src/test/functional/specFiles/journeyHelpers/integrationTarget.helper.ts` (target gating)
- `src/test/fixtures/fixtures.ts` (integration fixture wiring)
- `src/test/functional/utils/factories/contested/ContestedCaseFactory.ts` (real case and access-code setup)

### 11.3 Local mock access-code reseeding and why it is required

When running functional tests against local mock CCD (`http://localhost:4100`), any test that submits an access code must reseed case-session data before that submission.

Why this is needed:

- access codes are single-use in the journey flow because successful submission triggers code invalidation
- local mock runs frequently reuse the same deterministic fixture values across multiple tests in the same suite
- without reseeding, a previous test can consume the code and a later test can fail with an access-code mismatch that is unrelated to the scenario being tested

How this is applied:

- only in local mock mode, specs opt in with `test.use({ useMockTestSupport: true })`
- before each test that depends on code submission, specs call `injectCaseSession(caseId, applicantAccessCode, respondentAccessCode)`
- this reset is local-only and must not be used for shared-environment integration because test-support routes are intentionally unavailable there- `injectCaseSession` navigates the browser to `/enter-access-code` as part of its flow; for this reason, the mock reseed block and the real form-submission block must be mutually exclusive — use an `if/else` pattern, not sequential calls

Required `if/else` pattern for integration `beforeEach` hooks:

```typescript
if (isLocalMockCcd) {
  // Mock: inject session directly and land at /enter-access-code
  await basePage.injectCaseSession(
    contestedCaseWithHearing.caseId,
    contestedCaseWithHearing.applicantAccessCode,
    contestedCaseWithHearing.respondentAccessCode
  );
} else {
  // Real CCD: drive the full form journey from /enter-case-number
  await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
  await enterAccessCodePage.submitAccessCode(contestedCaseWithHearing.applicantAccessCode);
}
```

Do not call `submitCaseNumber` or `submitAccessCode` after `injectCaseSession` — the browser is already past the case-number form and those interactions will time out.
Expected outcome:

- each test starts from a clean, deterministic access-code state
- failures reflect real regression in UI/journey behavior rather than cross-test state leakage

Targeted runs:

```bash
# Mock only
yarn test:functional -- src/test/functional/specFiles/mock/

# Integration only
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
yarn test:functional:headed:slowmo -- src/test/functional/specFiles/integration/<file>.integration.spec.ts
yarn test:functional:headed:slowmo -- src/test/functional/specFiles/integration/<file>.integration.spec.ts --grep "<title fragment>"
```

Troubleshooting quick checks:

Missing test-support route:

```bash
yarn start:mock-case-api
ENABLE_TEST_SUPPORT_ROUTES=true yarn start:dev
yarn test:functional -- src/test/functional/specFiles/mock/
```

Integration suites skipped on local by default (demo remains hard-skipped):

```bash
export ACCESS_CODE_REAL_INTEGRATION=true
yarn test:functional -- src/test/functional/specFiles/integration/
```

CCD target not reachable:

```bash
echo $CCD_URL
echo $CCD_DATA_STORE_API_URL
```

Access codes not visible after issue application:

```bash
export ACCESS_CODE_MAX_TOTAL_RUNTIME_MS=45000
export ACCESS_CODE_FETCH_ATTEMPTS_PER_CASE=0
yarn test:functional -- src/test/functional/specFiles/integration/enterAccessCode.integration.spec.ts
```

## 14. What test evidence should be expected in a PR

For test-impacting PRs include:

1. What changed and why.
2. Commands run and outcomes.
3. Evidence for any remaining failures and reason.
4. UI change coverage (`functional` + `@a11y`).
5. Route/validation assertion updates where relevant.

Minimum expected command evidence for most changes:

- `yarn test`
- `yarn test:routes`
- `yarn test:api`
- `yarn test:functional`

For broad/risky changes:

- `yarn qacichecks`

## 15. Gaps in current test coverage

Current gaps to keep in mind:

- Cross-environment dependency issues (IDAM/S2S/CCD) can obscure product regressions.
- Some integration journeys remain sensitive to shared-env timing and eventual consistency.
- Smoke tests are intentionally shallow and do not prove full workflow behavior.

Where this currently shows up:

- `src/test/smoke/smoke.ts`
  - smoke now stays aligned to shared route/upload-step constants, but still focuses on route reachability and redirects rather than full user journeys.
- `src/test/api/workflows/`
  - most checks are contract/redirect focused; authenticated happy-path depth is still limited.
- `src/test/routes/task-list-upload.ts`
  - now asserts unauthenticated redirect to login; further depth could include authenticated render assertions if we add stable session setup in route tests.

Useful expansions to prioritize:

1. Add a small authenticated API happy-path set for key flows (case number and access code success path).
2. Add authenticated route-level assertions for key protected pages where we currently only validate unauthenticated redirects.
3. Keep smoke lean, but add one or two high-value “critical path” assertions so breakages are caught earlier.
4. Expand cross-browser checks for a small tagged subset of high-risk journeys (rather than the whole suite every run).

## 16. Contractor recommendations for strengthening the test suite

1. Add stronger preflight checks for env/auth prerequisites before long integration runs.
  - Where: `src/test/fixtures/fixtures.ts` and `src/test/functional/specFiles/journeyHelpers/`.
  - What to implement: fail fast when required env values are missing or when CCD/IDAM targets are not coherent for the selected run.
2. Continue replacing brittle selectors with role-first, user-facing locators in POMs.
  - Where: `src/test/functional/pom/`.
  - What to implement: prefer `getByRole()`, `getByLabel()`, and text-based locators over CSS class or positional selectors.
3. Expand shared journey helpers when setup/assertion flows repeat across suites.
  - Where: `src/test/functional/specFiles/journeyHelpers/` and shared helper modules under `src/test/functional/utils/helpers/`.
  - What to implement: move repeated login, navigation, and assertion flows into reusable helpers instead of duplicating them in specs.
4. Add a small authenticated API happy-path lane for case-number and access-code success paths.
  - Where: `src/test/api/workflows/`.
  - What to implement: add a couple of success-path workflow tests that verify authenticated route/session behaviour, not just redirects and failure cases.
5. Track and categorize flaky failure causes from CI to prioritize stabilization.
  - Where: CI outputs, failure logs, and the README troubleshooting section.
  - What to implement: group failures by auth/setup, DNS/network, CCD timing, or browser timing so the highest-impact fixes are obvious.

## 17. Which test should I add for a given type of change?

| Change type | Primary test to add | Secondary checks |
|---|---|---|
| Pure business logic or utility function | Unit test in `src/test/unit/` | Route/API tests only if route contract changes |
| New/changed route guard, redirect, validation branch | Route test in `src/test/routes/` | Unit test for route helper logic |
| Endpoint contract or workflow orchestration | API test in `src/test/api/` | Route test if redirect/render contract changes |
| Browser journey behavior (content, interaction, navigation) | Functional test in `src/test/functional/specFiles/` | Add/update POM methods and helper flows first |
| Route availability/redirect sanity for deployments | Smoke test in `src/test/smoke/smoke.ts` | No extra checks unless scope broadens |
| UI copy/layout/content with user impact | Functional test + `@a11y` assertion | Route test if server-side validation/redirect changed |

## 18. Which commands should I run before pushing?

Fast progression when iterating:

```bash
yarn test
yarn test:routes
yarn test:api
yarn test:functional
```

Single comprehensive gate before push:

```bash
yarn qacichecks
```

## 19. How do I debug failing Playwright tests?

1. Re-run only the failing spec file.
2. Re-run only the failing test title (`--grep`).
3. Use headed slowmo (`PWDEBUG=1`) to inspect each transition.
4. Enable CCD diagnostic logging when failures involve case setup/linking.
5. Check trace, screenshots, and HTML report before changing test timing.

Additional targeted runs:

```bash
# Mock only
yarn test:functional -- src/test/functional/specFiles/mock/

# Integration only
yarn test:functional -- src/test/functional/specFiles/integration/

# Tag filtering
yarn test:functional -- --grep "\[mock\]"
yarn test:functional -- --grep "\[integration\]"
```

## 20. Which tests give confidence in auth, CCD linking and document journeys?

Auth confidence:

- route protection/redirect tests (`src/test/routes/`)
- API auth workflow contracts (`src/test/api/workflows/`)
- functional integration login and session fixtures

CCD linking/access-code confidence:

- integration functional suites around enter-case-number and enter-access-code
- helper/factory retry and polling behavior in functional utils

Document journey confidence:

- integration suites for before-you-start, confidentiality, FDR, document selection, upload, and check-upload flows

## 21. Where is coverage weak today?

- The biggest weakness is environment-dependent integration stability rather than missing basic unit/route coverage.
- Local mock coverage is strong, but real-environment variance can still create noise.
- Continue improving authenticated API happy-path coverage and targeted cross-browser confidence where useful.

## 22. `src/test` overview

The `src/test` tree is split by test intent, not by technical implementation detail. That keeps the feedback loop clear: unit and route checks stay small, API checks prove server contracts, functional tests cover real journeys, and smoke tests stay shallow and fast.

How the tree fits together:

- `src/test/unit/` holds fast, isolated checks for logic, middleware, helpers, and small rendering or data-shaping behaviour.
- `src/test/routes/` checks route protection, redirects, validation, and route-level contracts without driving a browser.
- `src/test/api/` checks server-facing endpoints and workflow behaviour with Jest and Supertest.
- `src/test/functional/` holds Playwright journeys, page objects, helpers, and environment-specific setup.
- `src/test/smoke/` holds the smallest set of checks needed to confirm the service is up and the main routes respond.
- `src/test/fixtures/fixtures.ts` is the fixture hub for functional tests. It wires together browser pages, auth sessions, created cases, and shared audit helpers.
- `src/test/data/` stores shared static inputs when a scenario needs fixed test data rather than factory-generated data.
- `src/test/config.ts` contains shared test defaults such as URL and timing settings.

Practical rule of thumb:

- If the behaviour is pure code, start in `src/test/unit/`.
- If the behaviour is a route contract, start in `src/test/routes/`.
- If the behaviour is an endpoint or workflow contract, start in `src/test/api/`.
- If the behaviour depends on a browser, page state, or user journey, start in `src/test/functional/`.
- If the behaviour is only about availability or redirect sanity, start in `src/test/smoke/`.

## 23. Fixtures and how they work

Functional fixtures are defined in [src/test/fixtures/fixtures.ts](src/test/fixtures/fixtures.ts) with `test.extend(...)`. That means every Playwright spec that imports the shared `test` gets the same fixture contract and the same setup/teardown behaviour.

Fixture lifecycle:

- Option fixtures are declared first, such as `useMockTestSupport` and `useAutoA11yAudit`.
- Auto fixtures then read those options and decide whether to enforce mock-only rules or run accessibility checks after each test.
- Regular fixtures create reusable objects such as page objects, API helpers, authenticated sessions, and created case data.
- Playwright tears fixtures down automatically after each test or worker scope ends.

The main fixture groups are:

- `idamApiService`: creates and cleans up IDAM users.
- `citizenUser`: creates a fresh citizen user for the current test.
- `idamPage`: wraps the Playwright page for IDAM login flow steps.
- `loggedInPage`: performs the full OIDC login flow, waits for authentication, and lands the test on `/enter-case-number`.
- `enterCaseNumberPage`, `enterAccessCodePage`, `beforeYouStartPage`, `confidentialityPage`, `fdrPage`, `documentSelectionPage`, `documentUploadPage`, `checkUploadPage`, `dashboardPage`, `basePage`: page objects that keep selectors and interactions out of the specs.
- `contestedCaseForCaseNumber`: creates a real contested case for case-number linking tests.
- `contestedCaseWithHearing`: creates a contested case with access codes, using mock codes locally and real access-code generation only when the environment supports it.
- `axeUtils`: provides the Axe wrapper used by accessibility checks.
- `assertionHelpers`: shared assertion utilities for functional tests.

Mock and accessibility controls:

- `useMockTestSupport` is a test option. When it is set to `true`, the `mockTestSupport` auto fixture verifies that the test-support route exists and that the CCD target is local mock CCD.
- `useAutoA11yAudit` is a test option. When it is left at the default `true`, the `autoA11yAudit` fixture runs the accessibility audit after the test unless the spec already ran one itself.
- `runA11yAudit(...)` is the shared helper path that performs the Axe audit and the accessibility-tree assertion.

Why this matters:

- Specs stay short because they consume fixtures instead of rebuilding login, case creation, or page-object setup each time.
- Mock suites remain deterministic because the fixture layer can enforce the local test-support route.
- Integration suites stay realistic because the same fixture layer can switch to real IDAM and CCD flows when the target environment supports them.
- Accessibility coverage stays consistent because the fixture layer can apply the same audit pattern across the suite.

Common usage pattern in specs:

```typescript
test('example', async ({ loggedInPage, contestedCaseWithHearing, enterCaseNumberPage }) => {
  await enterCaseNumberPage.submitCaseNumber(contestedCaseWithHearing.caseId);
  expect(loggedInPage.authStatus).toBe('success');
});
```

## Appendix A. Environment variables used in testing

- `ACCESS_CODE_REAL_INTEGRATION`
- `ENABLE_TEST_SUPPORT_ROUTES`
- `TEST_URL`
- `RUNNING_ENV`
- `CCD_URL`
- `CCD_DATA_STORE_API_URL`
- `ACCESS_CODE_MAX_TOTAL_RUNTIME_MS`
- `ACCESS_CODE_FETCH_ATTEMPTS_PER_CASE`
- `ACCESS_CODE_FETCH_INITIAL_DELAY_MS`
- `ACCESS_CODE_FETCH_MAX_DELAY_MS`
- `ACCESS_CODE_CASE_CREATION_ATTEMPTS`
- `ACCESS_CODE_MANAGE_HEARINGS_REATTEMPTS`
- `CCD_LOG_PROGRESS`
- `CCD_VERBOSE_RETRY`
- `PLAYWRIGHT_WORKERS`
- `PLAYWRIGHT_RETRIES`

## Appendix B. Script reference highlights

Commands are defined in `package.json`.

- `yarn test:functional:install-deps`
- `yarn test:functional`
- `yarn test:functional:quick`
- `yarn test:functional:allBrowsers`
- `yarn test:functional:pr`
- `yarn test:functional:headed:slowmo`
- `yarn test:functional:allBrowsers:ui`
- `yarn test:playwright:a11y:chrome`
- `yarn test:playwright:a11y:all-browsers`
- `yarn qacichecks`
- `yarn qacichecks:allBrowsers`

## Maintenance notes

- Keep this guide practical and easy to scan.
- Keep spec-level implementation detail inside specs/helpers/POMs.
- If scripts or env gates change, update this file in the same PR.
