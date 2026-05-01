# Finrem Citizen UI

## Purpose

This repository contains the HMCTS Financial Remedy Citizen UI.

It provides the citizen-facing web journey for linking and viewing Financial Remedy cases, including:

- sign in via IDAM
- entering a Financial Remedy case number
- entering a case access code
- progressing through citizen case-linking and case access workflows

## Core Citizen Workflow

At a high level, the user flow is:

1. Citizen authenticates via IDAM.
2. Citizen lands on enter case number page.
3. Citizen submits a valid 16-digit Financial Remedy case number.
4. Citizen is routed to enter access code.
5. Citizen submits the access code to link/access the case.
6. Citizen user flows follow. 

## Prerequisites

- Node.js `>=24.14.1`
- Yarn `4.x`
- Docker (optional, for containerized local runs)
- Playwright browser dependencies (installed automatically by `yarn test:functional`)

## Run the App Locally

- [Node.js](https://nodejs.org/) v22.22.0 or later (Updated for Node 22 migration)
- [yarn](https://yarnpkg.com/) v4.x
- [Docker](https://www.docker.com)

Install dependencies:

```bash
yarn install
```

Build assets:

```bash
yarn build
```

Start app:

```bash
yarn start:dev
```

Local dev startup now loads `.env` automatically before the app config is initialised, so the same file is used by `yarn start:dev` and the checked-in VS Code debug profile.

Debug in VS Code:

```text
Run and Debug -> Finrem Citizen UI
```

Default local URL:

- `http://localhost:3100`

## Run with Docker

Build image:

```bash
docker-compose build
```

Run containers:

```bash
docker-compose up
```

This will start the frontend container exposing the application's port
(set to `3100` in this template app).

In order to test if the application is up, you can visit https://localhost:3100 in your browser.
You should get a very basic home page (no styles, etc.).

## Test Commands

### Unit and Route Tests (Jest)

Run default local test command:

```bash
yarn test
```

Run all unit tests:

```bash
yarn test:unit
```

Run route-specific tests:

```bash
yarn test:routes
```

Run with coverage:

```bash
yarn test:coverage
```

### Smoke Tests

Smoke tests verify key route availability and basic service readiness:

```bash
yarn test:smoke
```

### Functional Tests (Playwright)

> **`test:functional` is the default functional command used by CI (Jenkins preview functional stage) and local runs.**  
> It installs Playwright browsers and runs the full Chromium functional suite with 2 retries.

```bash
yarn test:functional
```

Run PR-tagged only tests (fast subset) when needed:

```bash
yarn test:functional:pr
```

> **`test:full-functional` remains available as an explicit full-suite command.**  
> It runs the full functional suite with 2 retries, but does not install browsers first.

Run the explicit full functional suite command:

```bash
yarn playwright install --with-deps   # one-time, if not already installed
yarn test:full-functional
```

Run one specific test in headed + slowmo mode (useful for debugging/verification):

```bash
yarn test:functional:headed:slowmo -- src/test/functional/specFiles/enterAccessCode.spec.ts:162
```

You can change the file path and line number each time to target a different test.

### Accessibility Tests (Playwright + axe)

Run accessibility-tagged tests (`@a11y`, Chromium):

```bash
yarn test:playwright:a11y
```

Run and open the generated a11y report in one command:

```bash
yarn test:playwright:a11y:report
```

Open the latest a11y report manually:

```bash
yarn playwright show-report a11y-output/axe-report
```

Note:

- The accessibility HTML report path is `a11y-output/axe-report`.
- Running `yarn playwright show-report` without a path looks for the default `playwright-report` folder.

### Manual Testing Setup

Use `setup:manual-test` to create a citizen user and a real contested case with a mocked access code, for manual testing, on preview environments:

```bash
yarn setup:manual-test
```

What it does:
- creates a new IDAM citizen user with generated credentials
- creates a contested Financial Remedy case
- prints the environment URL, login credentials, formatted case number, mock access codes, and a mock session injection URL

Use the output like this:
1. Run `yarn setup:manual-test`
2. Copy the username and password from the terminal output
3. Open the printed environment URL and log in
4. Copy and paste the printed `Mock Session Injection URL` into the same authenticated browser session
5. The app redirects to the access-code page with mock session data loaded
6. Enter `APPCODE1` or `RSPCODE1` to continue through the journey

`setup:manual-test` prints:
- the applicant mock code: `APPCODE1`
- the respondent mock code: `RSPCODE1`
- a ready-to-open `__test/inject-case-session` URL

Important:
- This only works in environments where `ENABLE_TEST_SUPPORT_ROUTES=true`
- It is for test/manual environments only; it does not generate real access codes in CCD

**Output example:**
```
✅ Setup Complete
========================================

Environment: pr-XXX
URL: https://finrem-citizen-ui-pr-XXX.preview.platform.hmcts.net

Login Credentials:
  Username: finrem-test-abc123def456@mailinator.com
  Password: Password1234

Case:
  Formatted: 1775-6599-1844-3356
  Raw:       1775659918443367

Mock Access Codes:
  Applicant: APPCODE1
  Respondent: RSPCODE1

Mock Session Injection URL:
  https://finrem-citizen-ui-pr-XXX.preview.platform.hmcts.net/__test/inject-case-session?caseNumber=1775659918443367&applicantCode=APPCODE1&respondentCode=RSPCODE1
```

## Test Strategy & Coverage Overview

This project uses a **multi-layer testing strategy** with clear separation between API integration tests, functional UI tests, and accessibility tests. All tests use **real integration** (no HTTP mocking) where possible.

### Test Pyramid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         END-TO-END (Playwright E2E)                         │
│                         • User journeys                                      │
│                         • Full workflow validation                           │
│                         • Some tests skipped due to Form C dependency        │
├─────────────────────────────────────────────────────────────────────────────┤
│                    FUNCTIONAL (Playwright UI Tests)                          │
│                    • Page UI validation                                      │
│                    • Form validation & error handling                        │
│                    • Accessibility audits (@a11y)                           │
│                    • 100% real integration (no mocks)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                        API (Jest + Supertest)                               │
│                        • Route endpoint validation                           │
│                        • Request/response contracts                          │
│                        • 100% real integration (no mocks)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                    UNIT & ROUTES (Jest)                                     │
│                    • Business logic validation                               │
│                    • Route structure & middleware                            │
│                    • Can use mocks where appropriate                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Tests - Real Integration Coverage

**Location**: `src/test/api/`

**Key Principle**: All API tests use real integration via **Supertest** (Express test utility). No HTTP mocking.

#### Public Endpoints (No Auth Required)
- `GET /` → Root route redirect
- `GET /login` → OIDC redirect or login page
- `GET /logout` → Logout redirect
- `GET /oauth2/callback` → OIDC callback handler
- `GET /health` → Health check endpoint
- `GET /health/liveness` → Liveness probe
- `GET /health/readiness` → Readiness probe
- `GET /info` → Build/runtime metadata

#### Protected Endpoints (Auth Required)
- `GET /dashboard` → Redirects to /login when unauthenticated
- `GET /enter-case-number` → Case number input page
- `POST /enter-case-number` → Case number submission (format validation, session storage)
- `GET /enter-access-code` → Access code input page
- `POST /enter-access-code` → Access code submission (format validation, CCD lookup)
- `GET /task-list-upload-dashboard` → Upload task list
- `GET /upload` → Upload journey root

#### API Test Files & Coverage

| File | Endpoints | Validations |
|------|-----------|-------------|
| `public-endpoints.test.ts` | GET endpoints (health, info, login, logout) | Status codes, headers, public accessibility |
| `protected-endpoints.test.ts` | GET endpoints requiring auth | 302 redirects when unauthenticated |
| `access-code.workflow.test.ts` | POST /enter-case-number, POST /enter-access-code | Case number format, access code validation, session storage |
| `form-validation.test.ts` | POST endpoints | Input validation (length, format, special chars, whitespace) |
| `authentication-flow.test.ts` | All routes with auth flows | OIDC flow, redirect chains, malformed tokens |
| `error-handling.test.ts` | Routes with error scenarios | 400/404/500 handling, invalid JSON, missing fields |
| `response-headers.test.ts` | All endpoints | Security headers, Content-Type, CORS headers |

#### Known API Test Gaps (Intentional Skips)

The following are not tested (by design or pending implementation):

- **Authenticated session validation** — Tests don't validate behavior WITH valid session; focus is on unauthenticated redirects
- **CCD case creation** — No tests for real CCD case creation; API tests use mock/invalid case numbers
- **File upload endpoints** — `/upload` POST not tested (upload journey tested via functional tests)
- **PUT/PATCH/DELETE** — Only GET/POST tested; other methods not yet implemented
- **Rate limiting** — No brute-force or throttling tests
- **HTTPS enforcement** — No SSL/TLS validation
- **Concurrent requests** — No parallel/race-condition tests

### Functional Tests - UI & E2E (Playwright)

**Location**: `src/test/functional/specFiles/`

**Key Principle**: All functional tests use **real integration** with actual CCD backend calls, IDAM login flows, and live session management. **No mocking of HTTP requests**.

#### Test Files & Responsibilities

| Spec | Purpose | Coverage | Notes |
|------|---------|----------|-------|
| `login.spec.ts` | Authentication & global UI | OIDC login, sign-out, header/footer, accessibility | All tests passing; no Form C dependency |
| `enterCaseNumber.spec.ts` | Case number submission | Valid format, hyphenated format, page content | All tests passing; no Form C dependency |
| `enterAccessCode.spec.ts` | Access code validation & happy path | Format validation, error messages, happy-path submit | ⚠️ Happy-path tests **SKIPPED** (see Form C section) |
| `persistentSessionLogin.spec.ts` | Session persistence | Re-login, multi-tab, navigation | ⚠️ All tests **SKIPPED** (see Form C section) |
| `dashboard.spec.ts` | Dashboard rendering & case details | Page layout, case info display | Status varies by case data availability |
| `confidentiality.spec.ts` | Confidentiality page & guidance | Form C8 link, guidance text, accessibility | Status varies by case data availability |

#### Functional Test Lanes (Mock vs Integration)

Tests are organized into two **lanes** controlled by environment variables:

##### **Lane 1: MOCK (Session Injection)**
- **When**: `FUNCTIONAL_TEST_LANE=mock` + `ACCESS_CODE_REAL_INTEGRATION=false`
- **How**: Tests use `basePage.injectCaseSession()` to inject mock session data (no CCD call needed)
- **Speed**: Very fast ⚡ (no backend roundtrips)
- **Reliability**: Deterministic (no external service dependency)
- **Current Status**: ⚠️ **SKIPPED** — Most mock happy-path tests are marked `test.skip()` due to Form C invalidation flow mismatch (see section below)
- **Use Case**: Intended for quick local/PR validation when Form C generation is available

##### **Lane 2: INTEGRATION (Real CCD & IDAM)**
- **When**: `FUNCTIONAL_TEST_LANE=integration` + `ACCESS_CODE_REAL_INTEGRATION=true` (DEFAULT)
- **How**: Tests create real CCD cases via ContestedCaseFactory, generate real access codes, use real IDAM login
- **Speed**: Slower 🐢 (multiple external API calls)
- **Reliability**: Depends on CCD & IDAM availability; includes 502 handling for FR_manageHearings outages
- **Current Status**: ✅ **ACTIVE** — This is the primary lane used by default and in pipelines
- **Use Case**: Full end-to-end workflow validation; CI/CD pipeline default

#### Running Tests by Lane

```bash
# Run integration tests (DEFAULT - used in CI)
yarn test:functional

# Run mock tests only (requires Form C generation to be implemented)
FUNCTIONAL_TEST_LANE=mock ACCESS_CODE_REAL_INTEGRATION=false yarn test:functional

# Run full suite with integration (explicit)
FUNCTIONAL_TEST_LANE=integration ACCESS_CODE_REAL_INTEGRATION=true yarn test:functional
```

### Form C Generation Dependency & Skipped Tests

#### What is Form C?

Form C is a CCD case document/artifact generated during case creation. It contains metadata that triggers the following chain:
1. Caseworker creates a case in CCD
2. CCD backend invokes the `FR_manageHearings` microservice callback
3. FR_manageHearings generates Form C and adds access codes to the case
4. Access codes are returned to the UI and stored in the citizen's session

#### Current Status: Form C Generation NOT Implemented

**Form C generation in the FR_manageHearings callback is not yet implemented.** This means:
- Cases created via CCD API do not get access codes generated
- Without access codes, the `POST /enter-access-code` happy-path (successful submission → redirect to dashboard) cannot complete
- Session-injected mock access codes (APPCODE1/RSPCODE1) do not exist in CCD backend, causing `invalidateAccessCode()` to fail when triggered

#### Skipped Tests Due to Form C

**enterAccessCode.spec.ts** (4 tests skipped):
```
⊗ [mock] Citizen can enter valid applicant access code and view case summary
⊗ [mock] Success: Access code with leading/trailing whitespace is accepted
⊗ [mock] Citizen can enter valid respondent access code and view case summary
⊗ [mock] Access code submission is case-insensitive
```
**Reason**: These tests use mock-injected access codes that don't exist in CCD, causing invalidation to fail.

**persistentSessionLogin.spec.ts** (3 tests skipped):
```
⊗ [mock] User lands on dashboard after re-login without re-entering case details
⊗ [mock] Case session persists across multiple tabs in same browser context
⊗ [mock] Case session persists when navigating away and back to dashboard
```
**Reason**: These tests depend on successful access code submission (above) as a precondition.

#### Unblocking These Tests

To re-enable these tests, one of the following must happen:

1. **Implement Form C generation** in FR_manageHearings — The preferred long-term solution
2. **Add a bypass flag** in `enter-access-code.ts` route to skip invalidation when `BYPASS_ACCESS_CODE_INVALIDATION=true`
3. **Accept test failure** as a known limitation while Form C is pending

**Current Recommendation**: Leave tests skipped until Form C is implemented. The integration lane provides sufficient coverage for the happy path once Form C is available.

#### Checking Test Visibility

To quickly see which tests are skipped and why, look for:
- `test.skip()` marker
- Comments mentioning "Form C" or "access codes are available"

Example:
```ts
/**
 * Kept skipped until Form C-generated access codes are available end to end.
 */
test.skip('[mock] Citizen can enter valid applicant access code...', async ({ ... }) => {
  // test body
});
```

### Accessibility Tests (@a11y)

All UI tests marked with `@a11y` tag also run **automated accessibility audits** using axe-core:

```bash
yarn test:playwright:a11y
```

Accessibility audits validate:
- WCAG 2.1 Level AA compliance
- Color contrast
- Alt text presence
- ARIA attributes
- Keyboard navigation

### Test Visibility Matrix

**At a Glance:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TEST LAYER              │ FRAMEWORK      │ INTEGRATION │ COVERAGE         │ STATUS
├──────────────────────────────────────────────────────────────────────────────┤
│ API Tests              │ Jest/Supertest │ Real ✓      │ 14 endpoints     │ ✅ All passing
│ Functional (UI)        │ Playwright     │ Real ✓      │ 6 spec files     │ ⚠️ Partial (Form C skip)
│ Accessibility (@a11y)  │ Playwright+axe │ Real ✓      │ WCAG 2.1 AA      │ ✅ Passing
│ Smoke Tests            │ Jest           │ Varies      │ Route health     │ ✅ Passing
│ Unit Tests             │ Jest           │ Mocked      │ Business logic   │ ✅ Passing
│ Routes Tests           │ Jest           │ Mocked      │ Route structure  │ ✅ Passing
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key Takeaway**:
- **API + Functional + A11y**: All use real integration
- **Unit + Routes**: Use mocks (appropriate for isolated logic testing)
- **Form C Dependency**: Only affects 7 mock-lane tests in enterAccessCode & persistentSessionLogin specs

## Where Test Artifacts Go

- Functional report artifacts: `functional-output/`
- Smoke report artifacts: `smoke-output/`
- Accessibility report artifacts: `a11y-output/`
- Allure Playwright results (when enabled in reporter config): `allure-results/`

## Test Structure

- Functional specs: `src/test/functional/specFiles/`
- Page objects: `src/test/functional/pom/`
- Shared Playwright fixtures: `src/test/fixtures/fixtures.ts`

## Writing Functional Tests: Fixtures and Helpers

Functional tests should stay thin and readable:

- Use fixtures for setup and dependency injection.
- Keep selectors/assertions in POM classes where possible.
- Use shared helpers for repeated assertion patterns.

### 1) Import `test` and `expect` from shared fixtures

Always import from `src/test/fixtures/fixtures.ts` in functional specs (not directly from Playwright) so shared fixtures are available:

```ts
import { DEFAULT_AXE_OPTIONS, expect, test } from '../../fixtures/fixtures';
```

### 2) Use injected fixtures in test arguments

Fixtures are injected by name in the test function parameter list.

Common fixtures:

- `loggedInPage`: completed login session and test user
- `dashboardPage`, `beforeYouStartPage`, `enterCaseNumberPage`, `enterAccessCodePage`: page objects
- `confidentialityGuidancePage`: confidentiality page object
- `assertionHelpers`: shared helper functions
- `axeUtils`: accessibility auditing utility

Example:

```ts
test('example', async ({
  loggedInPage: _loggedInPage,
  dashboardPage,
}) => {
  await assertionHelpers.expectExactTextsVisible(confidentialityGuidancePage.page, [
    'Confidential information could be, for example:',
  ]);
  await axeUtils.audit(DEFAULT_AXE_OPTIONS);
});
```

### 3) Prefer POM methods over inline locators

If an assertion is specific to a page, place it in that page object under `src/test/functional/pom/` and call it from the spec.

Good:

```ts
await confidentialityGuidancePage.verifyPurposeAndGuidanceLink();
```

Avoid (in spec files), unless truly one-off:

```ts
await expect(page.getByRole('heading', { name: 'Getting help' })).toBeVisible();
```

### 4) Shared helper: `assertionHelpers`

Location: `src/test/functional/utils/helpers/assertionHelpers.ts`


- `expectExactTextsVisible(page, texts)`

Use this for repeated exact text assertions where text appears. For mixed-content blocks (for example text combined with links or line breaks), prefer scoped `toContainText(...)` assertions in the POM.

Example:

```ts
await assertionHelpers.expectExactTextsVisible(page, [
  'addresses',
  'phone numbers',
]);
```

### 5) Keep tests DRY with `beforeEach`

Extract repeat navigation/setup into a shared helper function inside the spec (or into a POM method if page-specific):

```ts
test.beforeEach(async ({ loggedInPage: _loggedInPage, dashboardPage, beforeYouStartPage, page }) => {
  await dashboardPage.navigateToDashboard();
  await dashboardPage.clickGoToDocumentUpload();
  await beforeYouStartPage.startNowButton.click();
  await expect(page).toHaveURL(/\/upload\/confidentiality/);
});
```

### 6) Quick authoring checklist

- Import from shared fixtures.
- Inject only the fixtures needed for that test.
- Put page-specific logic in POM classes.
- Use `assertionHelpers` for repeated generic assertions.
- Use robust locators (`getByRole`, scoped locators, `toContainText` for mixed content).
- Keep test titles user-behavior focused and descriptive.

## Linting

Code style and quality are enforced with:

- ESLint for TypeScript/JavaScript
- Prettier for formatting
- Stylelint for stylesheets

Run lint:

```bash
yarn lint
```

Run lint with auto-fix:

```bash
yarn lint:fix
```

Run staged-file checks (used by git hooks):

```bash
yarn lint-staged
```

## License

Licensed under the MIT License. See [LICENSE](LICENSE).
