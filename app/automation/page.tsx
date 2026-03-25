"use client";

import { FormEvent, useMemo, useState } from "react";

import { AccessNote } from "@/components/access-note";
import { useAppStore } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import { AutomationPayload } from "@/lib/automation";
import { formatDate } from "@/lib/format";
import { WORKFLOW_LIBRARY } from "@/lib/workflows";
import { WorkflowTemplateId } from "@/lib/types";

function buildExamplePayloads(secret: string) {
  return {
    evidence: {
      type: "evidence.create",
      sourceName: "n8n",
      secret,
      title: "Quarterly access review export",
      description: "Uploaded automatically after review completion.",
      owner: "IT & Security",
      controlId: "control_access",
      policyId: "policy_access"
    },
    check: {
      type: "check.report",
      sourceName: "GitHub Actions",
      secret,
      checkId: "gha_branch_protection",
      title: "Branch protection policy check",
      status: "pass",
      summary: "All tracked repos require approvals and protected branches.",
      severity: "high",
      controlIds: ["control_change"]
    },
    task: {
      type: "task.create",
      sourceName: "Zapier",
      secret,
      title: "Collect new employee training record",
      owner: "People Ops",
      dueDate: "2026-03-28",
      priority: "medium"
    }
  };
}

export default function AutomationPage() {
  const { currentUser, store, rotateAutomationSecret, updateAutomationEnabled, applyAutomationPayload, resetDemo, runWorkflow } =
    useAppStore();
  const canManage = currentUser.role === "admin";
  const [payloadInput, setPayloadInput] = useState("");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<"ready" | "attention">("ready");
  const events = [...store.automation.events].sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
  const workflowRuns = [...store.workflowRuns].sort((left, right) => right.ranAt.localeCompare(left.ranAt));
  const latestWorkflowByTemplate = useMemo(() => {
    const map = new Map<WorkflowTemplateId, (typeof workflowRuns)[number]>();

    for (const run of workflowRuns) {
      if (!map.has(run.templateId)) {
        map.set(run.templateId, run);
      }
    }

    return map;
  }, [workflowRuns]);
  const examples = useMemo(() => buildExamplePayloads(store.automation.secret), [store.automation.secret]);

  function loadExample(key: keyof typeof examples) {
    setPayloadInput(JSON.stringify(examples[key], null, 2));
    setResultMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const parsed = JSON.parse(payloadInput) as AutomationPayload & { secret?: string };

      if (parsed.secret && parsed.secret !== store.automation.secret) {
        setResultTone("attention");
        setResultMessage("The example secret does not match the current automation token.");
        return;
      }

      const { secret, ...payload } = parsed;
      const result = await applyAutomationPayload(payload as AutomationPayload);
      setResultTone(result.ok ? "ready" : "attention");
      setResultMessage(result.summary);
    } catch (error) {
      setResultTone("attention");
      setResultMessage(error instanceof Error ? error.message : "Payload must be valid JSON.");
    }
  }

  async function handleRunWorkflow(templateId: WorkflowTemplateId) {
    try {
      const result = await runWorkflow(templateId);
      setResultTone(result.ok ? "ready" : "attention");
      setResultMessage(result.summary);
    } catch (error) {
      setResultTone("attention");
      setResultMessage(error instanceof Error ? error.message : "Workflow execution failed.");
    }
  }

  return (
    <section className="stack">
      {!canManage ? <AccessNote /> : null}

      <header className="split">
        <div>
          <p className="eyebrow">Automation</p>
          <h2 className="page-title">Automation studio</h2>
          <p className="muted">Run operator workflows or apply raw automation payloads against the shared backend workspace.</p>
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
          <p className="eyebrow">Mode</p>
          <h3>Server-backed event intake</h3>
          <p className="muted">Paste JSON payloads below to exercise the same backend persistence used by the rest of the app.</p>
          <div className="detail-row">
            <span>Last event {formatDate(store.automation.lastEventAt)}</span>
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Secret</p>
          <h3 className="mono">{store.automation.secret}</h3>
          <p className="muted">The examples below include this token so you can mirror a signed integration flow.</p>
          <button type="button" className="button section-gap" onClick={rotateAutomationSecret} disabled={!canManage}>
            Rotate secret
          </button>
        </article>
        <article className="panel">
          <p className="eyebrow">Status</p>
          <h3>{store.automation.enabled ? "Automation is live" : "Automation is paused"}</h3>
          <p className="muted">Pause intake without removing the current secret or event history.</p>
          <label className="checkbox-row section-gap" htmlFor="enabled">
            <input
              id="enabled"
              name="enabled"
              type="checkbox"
              checked={store.automation.enabled}
              onChange={(event) => updateAutomationEnabled(event.currentTarget.checked)}
              disabled={!canManage}
            />
            <span>Accept automation events</span>
          </label>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Workflow library</p>
            <h3>Operator runbooks</h3>
          </div>
          <StatusBadge
            tone={workflowRuns.some((run) => run.status === "warning") ? "monitoring" : "ready"}
            label={`${workflowRuns.length} runs`}
          />
        </div>
        <div className="grid-2">
          {WORKFLOW_LIBRARY.map((workflow) => {
            const latestRun = latestWorkflowByTemplate.get(workflow.id);

            return (
              <article key={workflow.id} className="item-card">
                <div className="split">
                  <div>
                    <p className="eyebrow">{workflow.cadence}</p>
                    <h3>{workflow.title}</h3>
                  </div>
                  <StatusBadge tone={latestRun?.status === "warning" ? "monitoring" : "ready"} label={latestRun ? latestRun.status : "ready"} />
                </div>
                <p className="muted">{workflow.description}</p>
                <div className="list section-gap">
                  {workflow.steps.map((step) => (
                    <div key={step} className="item-card">
                      <p className="muted">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="detail-row">
                  <span>{latestRun ? `Last run ${formatDate(latestRun.ranAt)}` : "Not run yet"}</span>
                  <span>{latestRun ? latestRun.summary : "No execution history yet"}</span>
                </div>
                <div className="inline-actions section-gap">
                  <button type="button" className="button" onClick={() => handleRunWorkflow(workflow.id)} disabled={!canManage}>
                    Run workflow
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid-3">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Example payload</p>
              <h3>Create evidence</h3>
            </div>
            <button type="button" className="button-ghost" onClick={() => loadExample("evidence")}>
              Load example
            </button>
          </div>
          <pre className="code-block">{JSON.stringify(examples.evidence, null, 2)}</pre>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Example payload</p>
              <h3>Report a check result</h3>
            </div>
            <button type="button" className="button-ghost" onClick={() => loadExample("check")}>
              Load example
            </button>
          </div>
          <pre className="code-block">{JSON.stringify(examples.check, null, 2)}</pre>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Example payload</p>
              <h3>Create a task</h3>
            </div>
            <button type="button" className="button-ghost" onClick={() => loadExample("task")}>
              Load example
            </button>
          </div>
          <pre className="code-block">{JSON.stringify(examples.task, null, 2)}</pre>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Simulator</p>
              <h3>Apply an automation payload</h3>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="stack">
            <div className="field">
              <label htmlFor="payloadInput">JSON payload</label>
              <textarea
                id="payloadInput"
                value={payloadInput}
                onChange={(event) => setPayloadInput(event.currentTarget.value)}
                placeholder='{"type":"check.report", ...}'
                disabled={!canManage}
              />
            </div>
            <div className="inline-actions">
              <button type="submit" className="button" disabled={!canManage}>
                Apply payload
              </button>
              <button type="button" className="button-ghost" onClick={resetDemo} disabled={!canManage}>
                Reset demo data
              </button>
            </div>
            {resultMessage ? (
              <div className="subtle-card">
                <StatusBadge tone={resultTone} label={resultTone === "ready" ? "accepted" : "error"} />
                <p className="muted section-gap">{resultMessage}</p>
              </div>
            ) : null}
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">How to use it</p>
              <h3>Operator workflow</h3>
            </div>
          </div>
          <div className="list">
            <div className="item-card">
              <p className="muted">1. Run a workflow template when you want guided operations, or load a raw payload when you need lower-level testing.</p>
            </div>
            <div className="item-card">
              <p className="muted">2. Watch tasks, checks, and automation history update together as the workflow progresses.</p>
            </div>
            <div className="item-card">
              <p className="muted">3. Refresh the page to confirm the server-backed state survives across sessions.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Workflow runs</p>
            <h3>Recent operator activity</h3>
          </div>
        </div>
        <div className="list">
          {workflowRuns.length === 0 ? (
            <div className="item-card">
              <p className="muted">No workflows have been executed yet.</p>
            </div>
          ) : (
            workflowRuns.map((run) => (
              <div key={run.id} className="item-card">
                <div className="split">
                  <div>
                    <p className="eyebrow">{run.templateId}</p>
                    <h3>{run.title}</h3>
                  </div>
                  <StatusBadge tone={run.status === "warning" ? "monitoring" : "ready"} label={run.status} />
                </div>
                <p className="muted">{run.summary}</p>
                <div className="detail-row">
                  <span>Ran by {run.actorName}</span>
                  <span>{formatDate(run.ranAt)}</span>
                  <span>
                    {run.taskCount} tasks · {run.checkCount} checks · {run.evidenceCount} evidence
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
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
