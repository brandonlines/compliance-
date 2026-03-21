import { rotateAutomationSecretAction, updateAutomationSettingsAction } from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function evidenceExample(secret: string) {
  return `curl -X POST https://your-trustops-host/api/automation \\
  -H "Content-Type: application/json" \\
  -H "x-trustops-key: ${secret}" \\
  -d '{
    "type": "evidence.create",
    "sourceName": "n8n",
    "title": "Quarterly access review export",
    "description": "Uploaded automatically after review completion.",
    "owner": "IT & Security",
    "controlId": "control_access",
    "policyId": "policy_access"
  }'`;
}

function checkExample(secret: string) {
  return `curl -X POST https://your-trustops-host/api/automation \\
  -H "Content-Type: application/json" \\
  -H "x-trustops-key: ${secret}" \\
  -d '{
    "type": "check.report",
    "sourceName": "GitHub Actions",
    "checkId": "gha_branch_protection",
    "title": "GitHub Actions branch protection check",
    "status": "pass",
    "summary": "All tracked repos require approvals and protected branches.",
    "severity": "high",
    "controlIds": ["control_change"]
  }'`;
}

function taskExample(secret: string) {
  return `curl -X POST https://your-trustops-host/api/automation \\
  -H "Content-Type: application/json" \\
  -H "x-trustops-key: ${secret}" \\
  -d '{
    "type": "task.create",
    "sourceName": "Zapier",
    "title": "Collect new employee security training record",
    "owner": "People Ops",
    "dueDate": "2026-03-28",
    "priority": "medium"
  }'`;
}

function githubActionExample(secret: string) {
  return `name: trust-ops-branch-check

on:
  workflow_dispatch:

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Report branch protection status
        run: |
          curl -X POST https://your-trustops-host/api/automation \\
            -H "Content-Type: application/json" \\
            -H "x-trustops-key: ${secret}" \\
            -d '{
              "type": "check.report",
              "sourceName": "GitHub Actions",
              "checkId": "gha_branch_protection",
              "title": "GitHub Actions branch protection check",
              "status": "pass",
              "summary": "Protected branches are enforced.",
              "severity": "high",
              "controlIds": ["control_change"]
            }'`;
}

export default async function AutomationPage() {
  const store = await getStore();
  const events = [...store.automation.events].sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));

  return (
    <section className="stack">
      <header className="split">
        <div>
          <p className="eyebrow">Automation</p>
          <h2 className="page-title">Webhook automation hub</h2>
          <p className="muted">
            Let GitHub Actions, Zapier, n8n, cron jobs, and internal scripts push evidence, check results, and tasks
            straight into the compliance workspace.
          </p>
        </div>
        <div className="pill-row">
          <StatusBadge tone={store.automation.enabled ? "ready" : "attention"} label={store.automation.enabled ? "enabled" : "disabled"} />
          <StatusBadge
            tone={events.some((event) => event.status === "rejected") ? "monitoring" : "ready"}
            label={`${events.length} events`}
          />
        </div>
      </header>

      <section className="grid-3">
        <article className="panel">
          <p className="eyebrow">Endpoint</p>
          <h3 className="mono">POST /api/automation</h3>
          <p className="muted">Use `x-trustops-key` or a Bearer token for authentication.</p>
          <div className="detail-row">
            <span>Last event {formatDate(store.automation.lastEventAt)}</span>
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Secret</p>
          <h3 className="mono">{store.automation.secret}</h3>
          <p className="muted">Rotate this if it leaks or when you move from local to hosted usage.</p>
          <form action={rotateAutomationSecretAction} className="section-gap">
            <button type="submit" className="button">
              Rotate secret
            </button>
          </form>
        </article>
        <article className="panel">
          <p className="eyebrow">Status</p>
          <h3>{store.automation.enabled ? "Automation is live" : "Automation is paused"}</h3>
          <p className="muted">Disable the endpoint without deleting the secret or existing event history.</p>
          <form action={updateAutomationSettingsAction} className="section-gap">
            <label className="checkbox-row" htmlFor="enabled">
              <input id="enabled" name="enabled" type="checkbox" defaultChecked={store.automation.enabled} />
              <span>Accept automation events</span>
            </label>
            <button type="submit" className="button section-gap">
              Save status
            </button>
          </form>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Supported event</p>
              <h3>Create evidence</h3>
            </div>
          </div>
          <p className="muted">
            Ideal for pushing review exports, screenshots, policy artifacts, or completion reports from automation tools.
          </p>
          <pre className="code-block">{evidenceExample(store.automation.secret)}</pre>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Supported event</p>
              <h3>Report a check result</h3>
            </div>
          </div>
          <p className="muted">
            External checks create or resolve remediation work through the same check engine the internal app uses.
          </p>
          <pre className="code-block">{checkExample(store.automation.secret)}</pre>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Supported event</p>
              <h3>Create a task</h3>
            </div>
          </div>
          <p className="muted">Useful when a workflow finds an issue that needs a human owner and due date.</p>
          <pre className="code-block">{taskExample(store.automation.secret)}</pre>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Example workflow</p>
              <h3>GitHub Actions snippet</h3>
            </div>
          </div>
          <p className="muted">A lightweight pattern for CI-driven compliance checks without full OAuth plumbing.</p>
          <pre className="code-block">{githubActionExample(store.automation.secret)}</pre>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Event log</p>
            <h3>Recent automation activity</h3>
          </div>
        </div>
        <div className="list">
          {events.map((event) => (
            <div key={event.id} className="item-card">
              <div className="split">
                <div>
                  <p className="eyebrow">{event.type}</p>
                  <h3>{event.source}</h3>
                </div>
                <StatusBadge tone={event.status === "accepted" ? "ready" : "attention"} label={event.status} />
              </div>
              <p className="muted">{event.summary}</p>
              <p className="caption">{formatDate(event.receivedAt)}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
