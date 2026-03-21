import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { getControlStatus, getEvidenceForControl, getLatestRunForControl } from "@/lib/compliance";
import { formatDate } from "@/lib/format";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ControlsPage() {
  const store = await getStore();
  const controls = [...store.controls].sort((left, right) => left.code.localeCompare(right.code));

  return (
    <section className="stack">
      <header>
        <p className="eyebrow">Controls</p>
        <h2 className="page-title">SOC 2 control map</h2>
        <p className="muted">Each control ties together policies, evidence, and runnable checks.</p>
      </header>

      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Control</th>
              <th>Owner</th>
              <th>Family</th>
              <th>Status</th>
              <th>Evidence</th>
              <th>Latest signal</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((control) => {
              const status = getControlStatus(control, store);
              const latestRun = getLatestRunForControl(control, store);

              return (
                <tr key={control.id}>
                  <td>
                    <p className="eyebrow">{control.code}</p>
                    <Link href={`/controls/${control.id}`}>{control.title}</Link>
                    <p className="caption">{control.description}</p>
                  </td>
                  <td>{control.owner}</td>
                  <td>{control.family}</td>
                  <td>
                    <StatusBadge tone={status} />
                  </td>
                  <td>{getEvidenceForControl(control.id, store).length}</td>
                  <td>
                    {latestRun ? (
                      <>
                        <StatusBadge tone={latestRun.status} />
                        <p className="caption">{formatDate(latestRun.ranAt)}</p>
                      </>
                    ) : (
                      <StatusBadge tone="monitoring" label="not run" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </section>
  );
}
