# Financial Remedy Citizen UI (finrem-citizen-ui)

The frontend application for citizens to manage their Financial Remedy applications. This application is built with Node.js, Express, and HMCTS standard libraries.

## Quick Start

### Prerequisites

* [Node.js](https://nodejs.org/) (v18+ recommended)
* [Yarn](https://yarnpkg.com/)
* [Docker](https://www.docker.com) (Optional, for container testing)

### 1. Install Dependencies

```bash
yarn install

```

### 2. Configure Environment Variables (.env)

You must create a `.env` file in the root directory. **Do not commit this file.**

1. Create a file named `.env` in the project root.
2. Copy the content below into it.
3. Ask a team member for the **Real IDAM Client Secret** (the `IDAM_SECRET` value).

**Template for .env:**

```properties
# Environment
NODE_ENV=development
NODE_CONFIG_ENV=development

IDAM_CLIENT=finrem-citizen-ui
IDAM_WEB_SERVICE=https://idam-web-public.aat.platform.hmcts.net
IDAM_API_SERVICE=https://idam-api.aat.platform.hmcts.net
SERVICES_IDAM_ISS_URL=https://forgerock-am.service.core-compute-idam-aat.internal:8443/openam/oauth2/hmcts

# Protocol & Callback (Must match HTTPS/Localhost)
PROTOCOL=https
OAUTH_CALLBACK_URL=https://localhost:3100/oauth2/callback

# SECRETS (Ask team for values)
# 1. IDAM Client Secret (Required for Login)
IDAM_SECRET=PLACEHOLDER_ASK_TEAM_FOR_REAL_SECRET

# 2. S2S Secret (Mocked Locally)
# We use a placeholder here because the local Mock S2S accepts anything.
S2S_SECRET=JBSWY3DPEBLW64TM
S2S_SERVICE=http://127.0.0.1:9000

MICROSERVICE=finrem_citizen_ui
SESSION_SECRET=["local-dev-secret-1"]

# Feature Flags
FEATURE_HELMET_ENABLED=true
FEATURE_REDIS_ENABLED=false
FEATURE_OIDC_ENABLED=false
FEATURE_SECURE_COOKIE_ENABLED=false
COOKIE_TOKEN=__auth__
COOKIE_USER_ID=__userid__
LOGIN_ROLE_MATCHER=.*

```

### 3. Run the Application

Start the application in development mode. This command automatically starts a **Local Mock S2S Server** to handle authentication handshakes.

```bash
yarn start:dev

```

* **App URL:** [https://localhost:3100]
* **Mock S2S:** [http://127.0.0.1:9000](http://127.0.0.1:9000) (Runs in background)

### 4. Verify Setup

1. Navigate to `https://localhost:3100`.
2. The app should automatically redirect you to the **HMCTS IDAM Login Page** (AAT).
3. Log in with your AAT credentials.
4. You should be redirected back to the application home page.

## Architecture & Local Mocking

### Why do we mock S2S locally?

The application uses `rpx-xui-node-lib` middleware which requires a Service-to-Service (S2S) token on startup. However, we cannot connect to the real AAT S2S service locally due to two blockers:

1. **Network Firewall:** The internal Kubernetes DNS (`rpe-service-auth-provider...`) is resolved but traffic is blocked (100% packet loss) over VPN.
2. **Missing Secrets:** We do not have access to the valid S2S secret for AAT.

**The Solution:**
When you run `yarn start:dev`, the `server.ts` script spins up a lightweight HTTP server on port **9000**.

* It intercepts calls to `/lease` and returns a valid JWT signed with a dummy key.
* This allows the app to boot and proceed to the **User Authentication (IDAM)** flow, which works perfectly over the public internet.

## Development

### Code Style

We use ESLint and Sass-lint.

```bash
yarn lint      # Check for issues
yarn lint --fix # Auto-fix issues

```

### Running Tests

```bash
yarn test         # Unit Tests (Jest)
yarn test:routes  # Functional/Route Tests
yarn test:a11y    # Accessibility Tests (Pa11y)

```

### Docker

To run the application in a container (closer to production):

```bash
docker-compose build
docker-compose up

```

*Note: You may need to adjust the `.env` networking to allow Docker to reach the IDAM services.*

## Security

* **CSRF:** Tokens are handled via `csurf`. Ensure all forms include `{{ csrfProtection(csrfToken) }}`.
* **Helmet:** Security headers are enabled by default. Configurable in `default.json`.
* **Health Check:** Available at `https://localhost:3100/health`.

## License

This project is licensed under the MIT License.
