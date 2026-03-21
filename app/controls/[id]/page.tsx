import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { Policy } from "@/lib/types";
import { getControlStatus, getEvidenceForControl, getPolicyStatus } from "@/lib/compliance";
import { formatDate } from "@/lib/format";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ControlDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const control = store.controls.find((entry) => entry.id === id);

  if (!control) {
    notFound();
  }

  const evidence = getEvidenceForControl(control.id, store);
  const policies = control.policyIds
    .map((policyId) => store.policies.find((policy) => policy.id === policyId))
    .filter((policy): policy is Policy => Boolean(policy));
  const runs = store.checkRuns
    .filter((run) => run.controlIds.includes(control.id) || control.testIds.includes(run.checkId))
    .sort((left, right) => right.ranAt.localeCompare(left.ranAt))
    .slice(0, 8);

  return (
    <section className="stack">
      <header>
        <Link href="/controls" className="button-ghost">
          Back to controls
        </Link>
        <p className="eyebrow section-gap">{control.code}</p>
        <h2 className="page-title">{control.title}</h2>
        <p className="muted">{control.description}</p>
        <div className="hero-meta">
          <StatusBadge tone={getControlStatus(control, store)} />
          <StatusBadge tone="monitoring" label={control.family} />
          <StatusBadge tone="ready" label={control.cadence} />
        </div>
      </header>

      <section className="grid-3">
        <article className="panel">
          <p className="eyebrow">Owner</p>
          <h3>{control.owner}</h3>
          <p className="muted">Primary control owner responsible for evidence and remediation.</p>
        </article>
        <article className="panel">
          <p className="eyebrow">Evidence mapped</p>
          <h3>{evidence.length}</h3>
          <p className="muted">Artifacts currently attached to this control.</p>
        </article>
        <article className="panel">
          <p className="eyebrow">Checks mapped</p>
          <h3>{control.testIds.length}</h3>
          <p className="muted">Automated signals tied to this control.</p>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Policies</p>
              <h3>Required documentation</h3>
            </div>
            <Link href="/policies" className="button-ghost">
              Open policies
            </Link>
          </div>
          <div className="list">
            {policies.map((policy) => (
              <div key={policy.id} className="item-card">
                <div className="split">
                  <div>
                    <h3>{policy.title}</h3>
                    <p className="muted">{policy.summary}</p>
                  </div>
                  <StatusBadge tone={getPolicyStatus(policy)} />
                </div>
                <div className="detail-row">
                  <span>Version {policy.version}</span>
                  <span>Last reviewed {formatDate(policy.lastReviewed)}</span>
                  <span>Due {formatDate(policy.nextReviewDue)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Latest checks</p>
              <h3>Control signals</h3>
            </div>
            <Link href="/checks" className="button-ghost">
              Open checks
            </Link>
          </div>
          <div className="list">
            {runs.length === 0 ? (
              <div className="item-card">
                <p className="muted">No automated checks have been run for this control yet.</p>
              </div>
            ) : (
              runs.map((run) => (
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
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Evidence</p>
            <h3>Artifacts for this control</h3>
          </div>
          <Link href="/evidence" className="button-ghost">
            Add evidence
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Owner</th>
                <th>Source</th>
                <th>Uploaded</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <p className="caption">{item.description}</p>
                  </td>
                  <td>{item.owner}</td>
                  <td>{item.source}</td>
                  <td>{formatDate(item.uploadedAt)}</td>
                  <td>
                    {item.fileName ? (
                      <a href={`/api/evidence/${item.id}`} className="button-ghost">
                        Open file
                      </a>
                    ) : (
                      <span className="caption">Snapshot only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
