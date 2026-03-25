# Trust Console

A server-backed compliance workspace with Postgres persistence, seeded dev auth, unit/integration coverage, and browser automation.

## What it includes

- SOC 2 control dashboard
- Evidence uploads backed by server persistence
- Policy review tracking
- Integration status and configuration
- Runnable automated checks
- Remediation task management
- Auditor packet view and JSON export
- Seeded dev auth for admin, auditor, and viewer flows
- Vitest unit and integration tests
- Playwright browser coverage
- CI for typecheck, unit/integration, build, and e2e

## Run it

```bash
npm install
npm run db:up
npm run db:push
npm run db:seed
npm run dev
```

Then open `http://localhost:3000/login`.

## Assumptions

- Built as a backend migration step, not a finished multi-tenant SaaS
- Uses Postgres as the shared source of truth
- Keeps the app-level compliance data as a typed workspace JSON blob in Postgres for now
- Seeds the workspace with sample data plus three dev users
- Still stores uploaded file contents as data URLs inside the persisted workspace state for this phase

## Local database

- Docker is used for local Postgres via [docker-compose.yml](/Users/brandonlines/Documents/Mathville/SOC2 Compliance /docker-compose.yml)
- The default connection string is in [.env.example](/Users/brandonlines/Documents/Mathville/SOC2 Compliance /.env.example)

## Testing

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

CI lives in [.github/workflows/ci.yml](/Users/brandonlines/Documents/Mathville/SOC2 Compliance /.github/workflows/ci.yml).
