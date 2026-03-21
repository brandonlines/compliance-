"use client";

import Link from "next/link";

import { useAppStore } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import { downloadTextFile } from "@/lib/browser";
import { buildAuditorPacket } from "@/lib/compliance";
import { formatDate } from "@/lib/format";

export default function AuditorPage() {
  const { store } = useAppStore();
  const packet = buildAuditorPacket(store);

  return (
    <section className="stack">
      <header className="split">
        <div>
          <p className="eyebrow">Auditor packet</p>
          <h2 className="page-title">One place to hand over the program</h2>
          <p className="muted">A clean summary of current controls, evidence, policies, checks, and open items.</p>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => downloadTextFile("auditor-packet.json", JSON.stringify(packet, null, 2))}
        >
          Download JSON packet
        </button>
      </header>

      <section className="grid-4">
        <article className="metric-card">
          <p className="eyebrow">Generated</p>
          <h3>{formatDate(packet.generatedAt)}</h3>
          <p className="muted">Current snapshot of the compliance workspace.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Readiness</p>
          <h3>{packet.summary.readinessScore}%</h3>
          <p className="muted">Controls currently marked ready.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Latest pass rate</p>
          <h3>{packet.summary.passRate}%</h3>
          <p className="muted">Based on the latest execution per check.</p>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Open tasks</p>
          <h3>{packet.openTasks.length}</h3>
          <p className="muted">Items that still need action before the next audit sample.</p>
        </article>
      </section>

      <section className="panel table-wrap">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Controls</p>
            <h3>Current control coverage</h3>
          </div>
          <Link href="/controls" className="button-ghost">
            Open controls
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Control</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Evidence count</th>
              <th>Latest check summary</th>
            </tr>
          </thead>
          <tbody>
            {packet.controls.map((control) => (
              <tr key={control.id}>
                <td>
                  <strong>{control.code}</strong>
                  <p className="caption">{control.title}</p>
                </td>
                <td>
                  <StatusBadge tone={control.status} />
                </td>
                <td>{control.owner}</td>
                <td>{control.evidenceCount}</td>
                <td>{control.latestChecks[0]?.summary ?? "No check run yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Policies</p>
              <h3>Review status</h3>
            </div>
          </div>
          <div className="list">
            {packet.policies.map((policy) => (
              <div key={policy.id} className="item-card">
                <div className="split">
                  <div>
                    <h3>{policy.title}</h3>
                    <p className="muted">{policy.owner}</p>
                  </div>
                  <span className="caption">Due {formatDate(policy.nextReviewDue)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Open items</p>
              <h3>Remaining work</h3>
            </div>
          </div>
          <div className="list">
            {packet.openTasks.length === 0 ? (
              <div className="item-card">
                <p className="muted">No open tasks remain.</p>
              </div>
            ) : (
              packet.openTasks.map((task) => (
                <div key={task.id} className="item-card">
                  <div className="split">
                    <div>
                      <h3>{task.title}</h3>
                      <p className="muted">{task.description}</p>
                    </div>
                    <StatusBadge tone={task.priority} />
                  </div>
                  <div className="detail-row">
                    <span>{task.owner}</span>
                    <span>Due {formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
