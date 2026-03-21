# Trust Console

A static compliance workspace demo that behaves the same in local dev and in an exported site build.

Published site: `https://brandonlines.github.io/compliance-/`

## What it includes

- SOC 2 control dashboard
- Evidence uploads with local file storage
- Policy review tracking
- Integration status and configuration
- Runnable automated checks
- Remediation task management
- Auditor packet view and JSON export
- Local automation event simulator for evidence, checks, and tasks

## Run it

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

To preview the exported static build:

```bash
npm run build
npm run start
```

Then open `http://localhost:3000/compliance-/`.

GitHub Pages deployment is automated from `main` via `.github/workflows/deploy.yml`.

## Assumptions

- Built as a portable demo instead of a hosted multi-user app
- Uses browser localStorage for persistence
- Stores uploaded evidence files as browser data URLs
- Seeds the workspace with a sample SOC 2 program on first run
- Exports to `out/` through `next build`

## Automation simulator

- Open the Automation page and paste a JSON payload to simulate inbound automation events
- Supported events:
  - `evidence.create`
  - `check.report`
  - `task.create`
