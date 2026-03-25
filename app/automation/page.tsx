"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAppStore } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import { AutomationPayload } from "@/lib/automation";
import { formatDate } from "@/lib/format";

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
  const { store, rotateAutomationSecret, updateAutomationEnabled, applyAutomationPayload, resetDemo } = useAppStore();
  const [payloadInput, setPayloadInput] = useState("");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<"ready" | "attention">("ready");
  const events = [...store.automation.events].sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
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
    } catch {
      setResultTone("attention");
      setResultMessage("Payload must be valid JSON.");
    }
  }

  return (
    <section className="stack">
      <header className="split">
        <div>
          <p className="eyebrow">Automation</p>
          <h2 className="page-title">Automation studio</h2>
          <p className="muted">Apply automation payloads against the shared backend so the whole workspace updates together.</p>
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
          <button type="button" className="button section-gap" onClick={rotateAutomationSecret}>
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
            />
            <span>Accept automation events</span>
          </label>
        </article>
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
              />
            </div>
            <div className="inline-actions">
              <button type="submit" className="button">
                Apply payload
              </button>
              <button type="button" className="button-ghost" onClick={resetDemo}>
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
              <h3>Static-site workflow</h3>
            </div>
          </div>
          <div className="list">
            <div className="item-card">
              <p className="muted">1. Load one of the example payloads or paste your own JSON into the simulator.</p>
            </div>
            <div className="item-card">
              <p className="muted">2. Apply the payload and watch evidence, checks, tasks, and the event log update instantly.</p>
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
