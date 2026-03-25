"use client";

import { FormEvent } from "react";

import { useAppStore } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import { getPolicyStatus } from "@/lib/compliance";
import { formatDate } from "@/lib/format";

export default function PoliciesPage() {
  const { store, reviewPolicy } = useAppStore();
  const policies = [...store.policies].sort((left, right) => left.nextReviewDue.localeCompare(right.nextReviewDue));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const policyId = String(data.get("policyId") ?? "");
    const reviewDate = String(data.get("reviewDate") ?? "").trim() || new Date().toISOString().slice(0, 10);
    await reviewPolicy(policyId, reviewDate);
    form.reset();
  }

  return (
    <section className="stack">
      <header>
        <p className="eyebrow">Policies</p>
        <h2 className="page-title">Policy review calendar</h2>
        <p className="muted">Keep your core operational policies current and audit-ready.</p>
      </header>

      <section className="grid-2">
        {policies.map((policy) => (
          <article key={policy.id} className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{policy.version}</p>
                <h3>{policy.title}</h3>
              </div>
              <StatusBadge tone={getPolicyStatus(policy)} />
            </div>
            <p className="muted">{policy.summary}</p>
            <div className="detail-row">
              <span>Owner {policy.owner}</span>
              <span>Last reviewed {formatDate(policy.lastReviewed)}</span>
              <span>Due {formatDate(policy.nextReviewDue)}</span>
            </div>
            <form onSubmit={handleSubmit} className="form-grid section-gap">
              <input type="hidden" name="policyId" value={policy.id} />
              <div className="field">
                <label htmlFor={`reviewDate-${policy.id}`}>Review date</label>
                <input id={`reviewDate-${policy.id}`} type="date" name="reviewDate" />
              </div>
              <div className="inline-actions" style={{ alignItems: "flex-end" }}>
                <button type="submit" className="button">
                  Mark reviewed
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </section>
  );
}
