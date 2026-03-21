import { reviewPolicyAction } from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import { getPolicyStatus } from "@/lib/compliance";
import { formatDate } from "@/lib/format";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const store = await getStore();
  const policies = [...store.policies].sort((left, right) => left.nextReviewDue.localeCompare(right.nextReviewDue));

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
            <form action={reviewPolicyAction} className="form-grid section-gap">
              <input type="hidden" name="policyId" value={policy.id} />
              <div className="field">
                <label htmlFor={`reviewDate-${policy.id}`}>Review date</label>
                <input id={`reviewDate-${policy.id}`} type="date" name="reviewDate" defaultValue={new Date().toISOString().slice(0, 10)} />
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
