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

## Testing

This project uses a **multi-layer testing strategy** with unit, API, functional, and smoke tests. All tests use **real integration** (no HTTP mocking) where possible.

**Quick Start:**

```bash
# Run default tests (unit + routes + smoke)
yarn test

# Run functional tests (Playwright UI + e2e)
yarn test:functional

# Run API tests (Jest + Supertest)
yarn test:api

# Run accessibility tests (@a11y)
yarn test:playwright:a11y
```

**Test Types:**

| Type | Framework | Location | Real Integration | Use Case |
|------|-----------|----------|------------------|----------|
| **Unit & Routes** | Jest | `src/test/unit/` | Mocked | Business logic & route structure |
| **API** | Jest + Supertest | `src/test/api/` | Real ✓ | Endpoint contracts & workflows |
| **Functional (UI/E2E)** | Playwright | `src/test/functional/specFiles/` | Real ✓ | User journeys & page interactions |
| **Accessibility** | Playwright + axe | (tagged @a11y) | Real ✓ | WCAG 2.1 AA compliance |
| **Smoke** | Jest | Verifies routes healthy | Real ✓ | Basic service readiness |

**Test Organization:**

- **Functional tests are split into two lanes** by environment:
  - `mock/` — Local-only tests that depend on mock session/test-support routes.
  - `integration/` — Integration-lane tests and `integration-happy-path` tests.

`integration-happy-path` tests are skipped by default and require `ACCESS_CODE_REAL_INTEGRATION=true` plus reachable real CCD dependencies.

**Running Functional Tests Locally:**

Functional tests require the mock CCD API server running:

```bash
# Terminal 1 - Start mock server
yarn start:mock-case-api

# Terminal 2 - Run functional tests
yarn test:functional
```

Tests will use the mock server endpoints or real CCD (if `CCD_URL` is overridden).

**For Detailed Test Strategy, Commands, and Setup:**

👉 See [src/test/functional/specFiles/README.md](src/test/functional/specFiles/README.md) — Complete guide to functional test organization, environment setup, and known issues (Form C dependency).

**Manual Testing (Local Mock Only):**

The manual test setup script creates a local citizen user and seeded mock case for local testing only. This script always runs in local mode with mock access codes.

1. Start the local mock case API:

```bash
yarn start:mock-case-api
```

2. Start the app with test-support routes enabled:

```bash
ENABLE_TEST_SUPPORT_ROUTES=true yarn start:dev
```

3. Generate manual-test credentials and case details:

```bash
yarn setup:manual-test
```

4. Log in with the printed credentials, then open the printed mock injection URL in the same browser session.

**Note:** This script is designed for local testing only. It will not work on preview/AAT environments.

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
