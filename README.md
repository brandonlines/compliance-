# Mathville Trust Ops

A self-hosted, single-tenant compliance MVP inspired by Vanta for smaller teams.

## What it includes

- SOC 2 control dashboard
- Evidence uploads with local file storage
- Policy review tracking
- Integration status and configuration
- Runnable automated checks
- Remediation task management
- Auditor packet view and JSON export
- Signed automation webhook for evidence, checks, and tasks

## Run it

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Assumptions

- Built as an internal tool for one company
- Uses local JSON persistence instead of a database for easier setup
- Stores uploaded evidence files under `data/uploads`
- Seeds the workspace with a sample SOC 2 program on first run

## Automation webhook

- Endpoint: `POST /api/automation`
- Auth: `x-trustops-key` header or Bearer token using the secret shown in the Automation page
- Supported events:
  - `evidence.create`
  - `check.report`
  - `task.create`
