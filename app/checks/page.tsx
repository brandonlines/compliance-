"use client";

import { useAppStore } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import { CHECK_LIBRARY, getLatestRunsByCheck } from "@/lib/compliance";
import { formatDate } from "@/lib/format";

export default function ChecksPage() {
  const { store, runChecks } = useAppStore();
  const latestRuns = getLatestRunsByCheck(store);
  const controlsById = new Map(store.controls.map((control) => [control.id, control]));
  const history = [...store.checkRuns].sort((left, right) => right.ranAt.localeCompare(left.ranAt)).slice(0, 12);

  return (
    <section className="stack">
      <header className="split">
        <div>
          <p className="eyebrow">Checks</p>
          <h2 className="page-title">Continuous monitoring lite</h2>
          <p className="muted">A small check engine that still gives the team useful compliance signals.</p>
        </div>
        <button type="button" className="button" onClick={runChecks}>
          Run all checks
        </button>
      </header>

      <section className="grid-3">
        {CHECK_LIBRARY.map((check) => {
          const run = latestRuns.get(check.id);

          return (
            <article key={check.id} className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{check.severity} severity</p>
                  <h3>{check.title}</h3>
                </div>
                <StatusBadge tone={run?.status ?? "monitoring"} label={run ? run.status : "not run"} />
              </div>
              <p className="muted">{check.description}</p>
              <div className="detail-row">
                {check.controlIds.map((controlId) => (
                  <span key={controlId}>{controlsById.get(controlId)?.code}</span>
                ))}
              </div>
              <p className="caption">
                {run ? `${formatDate(run.ranAt)} via ${run.sourceName ?? run.source} - ${run.summary}` : "No recent result yet."}
              </p>
            </article>
          );
        })}
      </section>

      <section className="panel table-wrap">
        <div className="panel-header">
          <div>
            <p className="eyebrow">History</p>
            <h3>Recent executions</h3>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Check</th>
              <th>Status</th>
              <th>Controls</th>
              <th>Source</th>
              <th>Ran</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {history.map((run) => (
              <tr key={run.id}>
                <td>{run.title}</td>
                <td>
                  <StatusBadge tone={run.status} />
                </td>
                <td>{run.controlIds.map((controlId) => controlsById.get(controlId)?.code).join(", ")}</td>
                <td>{run.sourceName ?? run.source}</td>
                <td>{formatDate(run.ranAt)}</td>
                <td>{run.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
