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
6. Citizen proceeds through case-linked user journeys.

## Prerequisites

- Node.js `>=22.22.0`
- Yarn `4.x`
- Docker (optional, for containerized local runs)
- Playwright browser dependencies (installed automatically by `yarn test:functional`)

## Run the App Locally

Install dependencies:

```bash
yarn install
```

Build assets:

```bash
yarn build
```

### Local App Startup

Start the app for development:

```bash
yarn start:dev
```

Default local URL: `http://localhost:3100`

### Local Functional Testing (with Mock CCD API)

For local functional testing with mock infrastructure, run:

```bash
# Terminal 1
yarn start:mock-case-api

# Terminal 2
ENABLE_TEST_SUPPORT_ROUTES=true yarn start:dev

# Terminal 3
yarn test:functional
```

Before running local functional tests, ensure `.env` uses local target values:
- `CCD_URL=http://localhost:4100`
- `CCD_DATA_STORE_API_URL=http://localhost:4100`

For full functional testing setup, environment gating, and mock data conventions, use:
`src/test/functional/specFiles/README.md`

Debug in VS Code:

```text
Run and Debug -> Finrem Citizen UI
```

## Environment Profiles

Important: `.env` file is not stored in this GitHub repository because it contains sensitive configuration/secrets.

- Get a valid `.env` from a Finrem developer or tester.
- Keep it local and never commit it.

The `.env` file is required for normal app startup and test execution. Without a valid `.env`, local runs and functional/API tests will fail because environment-specific URLs and credentials cannot be resolved.

The `.env` file is organised into shared defaults plus a `Target selection` section.

Enable only one target block at a time:

- local
- preview
- aat

Uncomment the four lines for the target you want and comment out the other target blocks.

This target selection controls both `CCD_URL` and `CCD_DATA_STORE_API_URL` used by local runs.

The active target lines are:

- `TEST_URL`
- `RUNNING_ENV`
- `CCD_URL`
- `CCD_DATA_STORE_API_URL`

Playwright target resolution order:

1. `TEST_URL` if set
2. `RUNNING_ENV` if `TEST_URL` is empty
3. fallback to `aat`

### How `.env` Is Used

The app and Playwright config both load the root `.env` automatically using `dotenv`.

- App runtime (`yarn start:dev`): reads API/service settings from `.env`
- Playwright runtime (`yarn test:functional*`): reads target selection from `.env`

For most runs, keep one active target block in `.env` and leave `TEST_URL` unset.

Use one-off shell overrides only when needed, for example:

```bash
RUNNING_ENV=aat ACCESS_CODE_REAL_INTEGRATION=true yarn test:functional
```

### Required vs Optional `.env` Variables

Required for normal app startup and functional test targeting:

- `RUNNING_ENV` (`local`, `pr-xxx`, `aat`)
- `CCD_URL`
- `CCD_DATA_STORE_API_URL`

Optional (highest precedence for Playwright target URL):

- `TEST_URL` (if set, overrides `RUNNING_ENV` URL resolution)

Optional for real access-code happy-path integration lane:

- `ACCESS_CODE_REAL_INTEGRATION=true`

IDAM values:

- If `IDAM_WEB_URL` and `IDAM_TESTING_SUPPORT_API_URL` are not set, defaults are derived from `IDAM_ENV` (defaults to `aat`).
- Set `IDAM_ENV` to match your target when needed (`aat`, `demo`, etc.).

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

This starts the frontend container on port `3100`.
Check health at `https://localhost:3100`.

## Testing

This project uses unit, API, functional, accessibility, and smoke tests.

Quick start:

```bash
# Run default tests (unit + routes + smoke)
yarn test

# Run functional tests (Playwright UI + e2e)
yarn test:functional

# Run functional tests across Chromium, Firefox, and WebKit
yarn test:functional:all-browsers

# Run API tests (Jest + Supertest)
yarn test:api

# Run accessibility tests (@a11y across Chromium, Firefox, and WebKit)
yarn test:playwright:a11y:all-browsers

# Run accessibility tests (@a11y on Chromium only)
yarn test:playwright:a11y:chrome
```

Browser coverage by script:

- `yarn test:functional`: Chromium only (`--project chromium`)
- `yarn test:functional:all-browsers`: all configured Playwright projects (Chromium, Firefox, WebKit)
- `yarn test:full-functional`: Chromium only (`--project chromium`)
- `yarn test:functional:pr`: Chromium only (`--project chromium`)
- `yarn test:playwright:a11y:chrome`: Chromium only (`--project chromium`)
- `yarn test:playwright:a11y:all-browsers`: all configured Playwright projects (Chromium, Firefox, WebKit), then opens the HTML report

Test types:

| Type | Framework | Location | Real Integration | Use Case |
|------|-----------|----------|------------------|----------|
| **Unit & Routes** | Jest | `src/test/unit/` | Mocked | Business logic & route structure |
| **API** | Jest + Supertest | `src/test/api/` | Real ✓ | Endpoint contracts & workflows |
| **Functional (UI/E2E)** | Playwright | `src/test/functional/specFiles/` | Real ✓ | User journeys & page interactions |
| **Accessibility** | Playwright + axe + @guidepup/playwright | (tagged @a11y) | Real ✓ | WCAG 2.x Level A and AA automated checks plus screen-reader-oriented assertions |
| **Smoke** | Jest | Verifies routes healthy | Real ✓ | Basic service readiness |

Documentation ownership:

- Root README (this file): project-level setup and command overview
- Functional testing details: [src/test/functional/specFiles/README.md](src/test/functional/specFiles/README.md)

Use [src/test/functional/specFiles/README.md](src/test/functional/specFiles/README.md) as the single source of truth for:

- mock vs integration lane rules
- environment gating and required variables
- targeted Playwright commands
- accessibility test conventions
- known functional-test issues and workarounds

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
