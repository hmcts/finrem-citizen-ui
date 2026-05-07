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

Run the local mock CCD/Azure case API stub:

```bash
yarn start:mock-case-api
```

Point the main app at the stub by overriding `CCD_URL`:

```bash
CCD_URL=http://localhost:4100 yarn start:dev
```

The mock server implements these five endpoints used by the app:

- `GET /cases/:caseId`
- `GET /cases/:caseId/event-triggers/:eventId`
- `POST /cases/:caseId/events`
- `POST /case-users`
- `POST /searchCases?ctid=:caseType`

Default seeded local case data:

- case ID: `1616591401473378`
- case type: `FinancialRemedyContested`
- applicant access code: `APPCODE1`
- respondent access code: `RSPCODE1`

Optional environment variables for the mock server:

- `MOCK_CASE_API_PORT`
- `MOCK_CASE_ID`
- `MOCK_CASE_TYPE`
- `MOCK_APPLICANT_ACCESS_CODE`
- `MOCK_RESPONDENT_ACCESS_CODE`

Local dev startup now loads `.env` automatically before the app config is initialised, so the same file is used by `yarn start:dev` and the checked-in VS Code debug profile.

Debug in VS Code:

```text
Run and Debug -> Finrem Citizen UI
```

Default local URL:

- `http://localhost:3100`

## Environment Profiles

The `.env` file is organised into shared defaults plus a `Target selection` section.

Only enable one target block at a time for test execution accross different environments:

- local
- preview
- aat

In practice this means:

- uncomment the four lines for the target you want to use
- comment out the equivalent lines in the other target blocks

The active target lines are:

- `TEST_URL`
- `RUNNING_ENV`
- `CCD_URL`
- `CCD_DATA_STORE_API_URL`

Playwright resolves the target in this order:

1. `TEST_URL` if set
2. `RUNNING_ENV` if `TEST_URL` is empty
3. fallback to `aat`

### Local Block

Use this for local app, plus local mock CCD API:

```dotenv
TEST_URL=http://localhost:3100
RUNNING_ENV=local
CCD_URL=http://localhost:4100
CCD_DATA_STORE_API_URL=http://localhost:4100
```

### Preview Block

Use this for preview environments such as `pr-356`:

```dotenv
# TEST_URL=
RUNNING_ENV=pr-356
CCD_URL=XXXX
CCD_DATA_STORE_API_URL=XXXX
```

### AAT Block

Use this for AAT-backed runs:

```dotenv
# TEST_URL=
RUNNING_ENV=aat
CCD_URL=XXXX
CCD_DATA_STORE_API_URL=XXXX
```

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

### API Tests (Playwright)

Run the mock case API integration tests:

```bash
yarn test:api
```

This runs:

```bash
playwright test api/api-tests.spec.ts --config playwright.config.mts --project=chromium
```

### Functional Tests (Playwright)

> **`test:functional` is the default functional command used by CI (Jenkins preview functional stage) and local runs.**  
> It installs Playwright browsers and runs the full Chromium functional suite with 2 retries.

```bash
yarn test:functional
```

### Mock vs Real Integration Tests

The functional suite now contains two distinct categories of tests:

- `[mock]` tests
- `[real-integration]` tests

`[mock]` tests are intended for local development and deterministic preview/manual flows.

They use:

- the local mock case API on `http://localhost:4100`
- seeded case data from `.env`
- `/__test/inject-case-session` when required

`[real-integration]` tests are opt-in only.

They use:

- real CCD-backed case creation
- real environment connectivity and credentials
- the target selected by your active `.env` block

The flag controlling access-code real integration is:

```dotenv
ACCESS_CODE_REAL_INTEGRATION=false
```

Recommended defaults for local mock runs:

```dotenv
ACCESS_CODE_REAL_INTEGRATION=false
ENABLE_TEST_SUPPORT_ROUTES=true
```

With that setup:

- mock suites run locally when `CCD_URL` points to `http://localhost:4100`
- real-integration suites remain visible in Playwright output but are skipped by default

### Why Mock Tests Do Not Run In Preview Or AAT

This is intentional and enforced by shared Playwright fixtures.

Mock tests are designed for local deterministic runs only and require both of the following:

- `CCD_URL` (or `CCD_DATA_STORE_API_URL`) set to `http://localhost:4100`
- test-support session injection route `'/__test/inject-case-session'` available

In preview/AAT:

- CCD URLs point to real environment services, not the local mock API
- test-support routes are commonly disabled or restricted

As a result, mock-tagged tests are skipped there by design, while real integration paths are used when enabled. This avoids false confidence from mock behavior in shared environments and keeps CI behavior predictable.

### Commands By Environment

### Local Mock Run

Use this when you want fast, reliable local functional coverage without real CCD dependencies.

`.env` setup:

- uncomment the local block
- comment out preview and aat blocks
- keep `ACCESS_CODE_REAL_INTEGRATION=false`
- keep `ENABLE_TEST_SUPPORT_ROUTES=true`

Commands:

```bash
yarn start:mock-case-api
yarn test:functional
```

If the app is not already running, Playwright will start it locally using the active `.env` values.

### Preview Run

Use this when running against a preview environment.

`.env` setup:

- uncomment the preview block
- set `RUNNING_ENV` to the required PR, for example `pr-356`
- comment out local and aat blocks
- keep `ACCESS_CODE_REAL_INTEGRATION=false` unless you explicitly want real integration access-code coverage

Command:

```bash
yarn test:functional
```

### AAT Real Integration Run

Use this only when the environment is reachable and you want real CCD-backed integration coverage.

`.env` setup:

- uncomment the aat block
- comment out local and preview blocks
- set `ACCESS_CODE_REAL_INTEGRATION=true` only if you want the real integration access-code paths to execute

Command:

```bash
yarn test:functional
```

### Common Pitfalls

- If `RUNNING_ENV` is commented out and `TEST_URL` is empty, Playwright falls back to AAT.
- If `CCD_URL` still points to AAT while running locally, mock tests may skip and any CCD-backed setup will fail or retry.
- If `ACCESS_CODE_REAL_INTEGRATION=true`, tests marked for real integration will execute and expect reachable CCD dependencies.
- If `ENABLE_TEST_SUPPORT_ROUTES=false`, tests that depend on `/__test/inject-case-session` will skip or fail depending on the path used.

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
