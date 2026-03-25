"use client";

import Link from "next/link";

import { useAppStore } from "@/components/app-provider";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import {
  getControlStatus,
  getDashboardMetrics,
  getLatestRunsByCheck,
  getPolicyStatus
} from "@/lib/compliance";
import { formatDate } from "@/lib/format";

export default function DashboardPage() {
  const { store, runChecks } = useAppStore();
  const metrics = getDashboardMetrics(store);
  const latestRuns = [...getLatestRunsByCheck(store).values()]
    .sort((left, right) => right.ranAt.localeCompare(left.ranAt))
    .slice(0, 5);
  const attentionControls = store.controls.filter((control) => getControlStatus(control, store) === "attention");
  const upcomingPolicies = [...store.policies]
    .sort((left, right) => left.nextReviewDue.localeCompare(right.nextReviewDue))
    .slice(0, 4);
  const activeTasks = store.tasks
    .filter((task) => task.status !== "done")
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">SOC 2 workspace</p>
          <h2>Operational compliance work in a Postgres-backed app.</h2>
          <p className="muted">
            Track controls, keep evidence fresh, run lightweight checks, and package the program for audit review with
            shared server-side persistence.
          </p>
          <div className="hero-meta">
            <StatusBadge tone="monitoring" label={store.organization.framework} />
            <StatusBadge tone="ready" label={store.organization.auditWindow} />
            <StatusBadge tone="ready" label={store.organization.workspaceMode} />
          </div>
          <div className="hero-actions">
            <button type="button" className="button" onClick={runChecks}>
              Run compliance checks
            </button>
            <Link href="/auditor" className="button-ghost">
              Open auditor packet
            </Link>
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Workspace profile</p>
              <h3>{store.organization.name}</h3>
            </div>
            <StatusBadge tone={metrics.counts.attention > 0 ? "attention" : "ready"} />
          </div>
          <div className="stack">
            <div className="item-card">
              <p className="eyebrow">Program owner</p>
              <h3>{store.organization.owner}</h3>
              <p className="muted">{store.organization.industry}</p>
            </div>
            <div className="item-card">
              <p className="eyebrow">What this demo covers</p>
              <p className="muted">
                Controls, evidence, policies, integration posture, remediation tasks, automation events, and an audit
                packet export.
              </p>
            </div>
            <div className="item-card">
              <p className="eyebrow">Persistence</p>
              <p className="muted">Your changes are saved in Postgres, so teammates and test sessions share the same state.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid-4">
        <MetricCard
          label="Readiness score"
          value={`${metrics.readinessScore}%`}
          detail={`${metrics.counts.ready} of ${store.controls.length} controls currently ready`}
        />
        <MetricCard
          label="Checks pass rate"
          value={`${metrics.passRate}%`}
          detail={store.checkRuns.length === 0 ? "Run checks to establish a baseline" : "Based on the latest run per check"}
        />
        <MetricCard label="Open tasks" value={metrics.openTasks} detail="Operational follow-ups still in flight" />
        <MetricCard
          label="Overdue policies"
          value={metrics.overduePolicies}
          detail="Policies past their annual review date"
        />
      </section>

      <section className="grid-2 section-gap">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Needs attention</p>
              <h3>Controls requiring action</h3>
            </div>
            <Link href="/controls" className="button-ghost">
              View all controls
            </Link>
          </div>
          <div className="list">
            {attentionControls.length === 0 ? (
              <div className="item-card">
                <p className="muted">No controls are currently in the attention state.</p>
              </div>
            ) : (
              attentionControls.map((control) => (
                <div key={control.id} className="item-card">
                  <div className="split">
                    <div>
                      <p className="eyebrow">{control.code}</p>
                      <h3>
                        <Link href={`/controls/${control.id}`}>{control.title}</Link>
                      </h3>
                    </div>
                    <StatusBadge tone="attention" />
                  </div>
                  <p className="muted">{control.description}</p>
                  <div className="detail-row">
                    <span>{control.owner}</span>
                    <span>{control.family}</span>
                    <span>{control.cadence}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Latest checks</p>
              <h3>Signals from the current program</h3>
            </div>
            <div className="inline-actions">
              <Link href="/checks" className="button-ghost">
                Open checks
              </Link>
              <Link href="/automation" className="button-ghost">
                Open automation
              </Link>
            </div>
          </div>
          <div className="list">
            {latestRuns.length === 0 ? (
              <div className="item-card">
                <p className="muted">No checks have been run yet. Use the dashboard action to generate the first run.</p>
              </div>
            ) : (
              latestRuns.map((run) => (
                <div key={run.id} className="item-card">
                  <div className="split">
                    <div>
                      <h3>{run.title}</h3>
                      <p className="caption">
                        {formatDate(run.ranAt)} via {run.sourceName ?? run.source}
                      </p>
                    </div>
                    <StatusBadge tone={run.status} />
                  </div>
                  <p className="muted">{run.summary}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="grid-2 section-gap">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Upcoming reviews</p>
              <h3>Policy review schedule</h3>
            </div>
            <Link href="/policies" className="button-ghost">
              Review policies
            </Link>
          </div>
          <div className="list">
            {upcomingPolicies.map((policy) => (
              <div key={policy.id} className="item-card">
                <div className="split">
                  <div>
                    <h3>{policy.title}</h3>
                    <p className="muted">{policy.owner}</p>
                  </div>
                  <StatusBadge tone={getPolicyStatus(policy)} />
                </div>
                <div className="detail-row">
                  <span>Last reviewed {formatDate(policy.lastReviewed)}</span>
                  <span>Due {formatDate(policy.nextReviewDue)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Action queue</p>
              <h3>Current remediation work</h3>
            </div>
            <Link href="/tasks" className="button-ghost">
              Open tasks
            </Link>
          </div>
          <div className="list">
            {activeTasks.map((task) => (
              <div key={task.id} className="item-card">
                <div className="split">
                  <div>
                    <h3>{task.title}</h3>
                    <p className="muted">{task.owner}</p>
                  </div>
                  <StatusBadge tone={task.status} />
                </div>
                <p className="muted">{task.description}</p>
                <div className="detail-row">
                  <span>Priority {task.priority}</span>
                  <span>Due {formatDate(task.dueDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
