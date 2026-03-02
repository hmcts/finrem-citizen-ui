# Express application template

## Purpose

The purpose of this template is to speed up the creation of new [Express](http://expressjs.com/) frontend
applications within HMCTS and help keep the same development standards across multiple teams.
If you need to create a new application, you can simply use this one as a starting point and build on top of it.

## What's inside

The template is a working application with a minimal setup. It contains:

- application skeleton
- common dependencies
- Docker setup
- static analysis set up
- integration with Travis CI
- HTTPS set up for development environment
- CSRF prevention set up
- Header-based security provided by [Helmet](https://helmetjs.github.io/)
- basic health endpoint
- pa11y set up for accessibility testing
- MIT license and contribution information

## Setup

Located in `./bin/init.sh`. Simply run and follow the explanation how to execute it.

## Getting Started

### Prerequisites

Running the application requires the following tools to be installed in your environment:

- [Node.js](https://nodejs.org/) v22.22.0 or later (Updated for Node 22 migration)
- [yarn](https://yarnpkg.com/) v4.x
- [Docker](https://www.docker.com)

### Running the application

Install dependencies by executing the following command:

```bash
yarn install
```

Bundle:

```bash
yarn webpack
```

Run:

```bash
yarn start
```

The applications's home page will be available at http://localhost:3100

### Running with Docker

Create docker image:

```bash
docker-compose build
```

Run the application by executing the following command:

```bash
docker-compose up
```

This will start the frontend container exposing the application's port
(set to `3100` in this template app).

In order to test if the application is up, you can visit https://localhost:3100 in your browser.
You should get a very basic home page (no styles, etc.).

## Developing

### Code style

We use [ESLint](https://github.com/typescript-eslint/typescript-eslint)
alongside [sass-lint](https://github.com/sasstools/sass-lint)

Running the linting with auto fix:

```bash
yarn lint --fix
```

### Functional Testing (BDD)

This project uses [Playwright-BDD](https://github.com/vitalets/playwright-bdd), which allows writing tests in Gherkin (Cucumber) format.

#### Folder Structure

- `src/test/functional/features/*.feature`: Gherkin feature files.
- `src/test/steps/*.steps.ts`: Step definitions mapping Gherkin to Playwright code.
- `.features-gen/`: **(Do not edit)** Contains the auto-generated test files created by `bddgen`.

#### How it works

1. Edit or create a `.feature` file.
2. Run `yarn bddgen` to sync the features with the test runner.
3. Run `yarn test:functional` to execute the tests.

> **Note:** If you run the test scripts via `yarn`, `bddgen` is automatically executed as a pre-step. If you use the Playwright VS Code extension, you may need to run `yarn bddgen` manually if your changes aren't appearing.

### Running the tests

This template app uses [Jest](https://jestjs.io//) as the test engine. You can run unit tests by executing
the following command:

```bash
yarn test
```

Here's how to run functional tests (tests with @PR tag applied to them)

```bash
yarn test:functional
```

Here's how to run full unctional tests (entire functional suite)

```bash
yarn test:full-functional
```

Heres how to run accessibility tests, Accessibility tests use Playwright and Axe-core. They are located in 'src/test/a11y/a11y.test.ts'

```bash
yarn test:a11y
```

Make sure all the paths in your application are covered by accessibility tests (see [a11y.ts](src/test/a11y/a11y.ts)).

### Security

#### CSRF prevention

[Cross-Site Request Forgery](https://github.com/pillarjs/understanding-csrf) prevention has already been
set up in this template, at the application level. However, you need to make sure that CSRF token
is present in every HTML form that requires it. For that purpose you can use the `csrfProtection` macro,
included in this template app. Your njk file would look like this:

```
{% from "macros/csrf.njk" import csrfProtection %}
...
<form ...>
  ...
    {{ csrfProtection(csrfToken) }}
  ...
</form>
...
```

#### Helmet

This application uses [Helmet](https://helmetjs.github.io/), which adds various security-related HTTP headers
to the responses. Apart from default Helmet functions, following headers are set:

- [Referrer-Policy](https://helmetjs.github.io/docs/referrer-policy/)
- [Content-Security-Policy](https://helmetjs.github.io/docs/csp/)

There is a configuration section related with those headers, where you can specify:

- `referrerPolicy` - value of the `Referrer-Policy` header

Here's an example setup:

```json
    "security": {
      "referrerPolicy": "origin",
    }
```

Make sure you have those values set correctly for your application.

### Healthcheck

The application exposes a health endpoint (https://localhost:3100/health), created with the use of
[Nodejs Healthcheck](https://github.com/hmcts/nodejs-healthcheck) library. This endpoint is defined
in [health.ts](src/main/routes/health.ts) file. Make sure you adjust it correctly in your application.
In particular, remember to replace the sample check with checks specific to your frontend app,
e.g. the ones verifying the state of each service it depends on.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
