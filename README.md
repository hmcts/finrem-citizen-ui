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

- Node.js `>=22.22.0`
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

Run PR-tagged functional suite (`@PR`, Chromium):

```bash
yarn test:functional
```

Run broader functional suite with configured retries:

```bash
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

Create a citizen user and contested case for manual testing purposes:

```bash
yarn setup:manual-test
```

**Purpose:** Automates the setup of test users and case data needed for manual application testing. This script:
- Creates a new IDAM citizen user account with auto-generated credentials
- Creates a contested Financial Remedy case via the case factory (matches what automated tests use)
- Outputs login credentials and a formatted case number ready for manual testing

**Output example:**
```
✅ Setup Complete
========================================

Environment: pr-293
URL: https://finrem-citizen-ui-pr-293.preview.platform.hmcts.net

Login Credentials:
  Username: finrem-test-abc123def456@mailinator.com
  Password: Password1111

Case:
  Formatted: 1775-6599-1844-3387
  Raw:       1775659918443387

Usage: Log in with the credentials above, then enter the formatted case number.
```

**Typical workflow:**
1. Run `yarn setup:manual-test`
2. Note the username, password, and formatted case number from the output
3. Navigate to your environment URL (shown in output)
4. Log in with the provided credentials
5. Enter the formatted case number when prompted
6. You now have a live case to manually test against

## Where Test Artifacts Go

- Functional report artifacts: `functional-output/`
- Smoke report artifacts: `smoke-output/`
- Accessibility report artifacts: `a11y-output/`
- Allure Playwright results (when enabled in reporter config): `allure-results/`

## Test Structure

- Functional specs: `src/test/functional/specFiles/`
- Page objects: `src/test/functional/pom/`
- Shared Playwright fixtures: `src/test/fixtures/fixtures.ts`

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
