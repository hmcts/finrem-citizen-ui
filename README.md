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
