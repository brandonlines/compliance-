"use client";

import { FormEvent } from "react";
import Link from "next/link";

import { useAppStore } from "@/components/app-provider";
import { formatDate } from "@/lib/format";

export default function EvidencePage() {
  const { store, uploadEvidence } = useAppStore();
  const controlsById = new Map(store.controls.map((control) => [control.id, control]));
  const policies = [...store.policies].sort((left, right) => left.title.localeCompare(right.title));
  const evidence = [...store.evidence].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await uploadEvidence({
      title: String(data.get("title") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      owner: String(data.get("owner") ?? "").trim(),
      controlId: String(data.get("controlId") ?? "").trim(),
      policyId: String(data.get("policyId") ?? "").trim(),
      file: data.get("file") instanceof File ? (data.get("file") as File) : null
    });
    form.reset();
  }

  return (
    <section className="stack">
      <header>
        <p className="eyebrow">Evidence</p>
        <h2 className="page-title">Evidence locker</h2>
        <p className="muted">Upload files or log snapshots that prove each control is actually operating.</p>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Add evidence</p>
            <h3>Store a new artifact</h3>
          </div>
          <p className="caption">Uploads stay in this browser so the exported site works like local dev.</p>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" placeholder="Quarterly access review export" required />
          </div>
          <div className="field">
            <label htmlFor="owner">Owner</label>
            <input id="owner" name="owner" placeholder="IT & Security" required />
          </div>
          <div className="field">
            <label htmlFor="controlId">Mapped control</label>
            <select id="controlId" name="controlId" required>
              <option value="">Choose a control</option>
              {store.controls.map((control) => (
                <option key={control.id} value={control.id}>
                  {control.code} - {control.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="policyId">Related policy</label>
            <select id="policyId" name="policyId">
              <option value="">Optional</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field field-full">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" placeholder="What this evidence shows and why it matters." />
          </div>
          <div className="field field-full">
            <label htmlFor="file">File upload</label>
            <input id="file" name="file" type="file" />
          </div>
          <div className="inline-actions field-full">
            <button type="submit" className="button">
              Save evidence
            </button>
            <Link href="/controls" className="button-ghost">
              Review mapped controls
            </Link>
          </div>
        </form>
      </section>

      <section className="panel table-wrap">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Library</p>
            <h3>Recent artifacts</h3>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Evidence</th>
              <th>Control</th>
              <th>Owner</th>
              <th>Source</th>
              <th>Uploaded</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((item) => {
              const control = controlsById.get(item.controlId);

              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <p className="caption">{item.description}</p>
                  </td>
                  <td>
                    {control ? (
                      <Link href={`/controls/${control.id}`}>
                        {control.code} - {control.title}
                      </Link>
                    ) : (
                      "Unmapped"
                    )}
                  </td>
                  <td>{item.owner}</td>
                  <td>{item.source}</td>
                  <td>{formatDate(item.uploadedAt)}</td>
                  <td>
                    {item.fileDataUrl ? (
                      <a href={item.fileDataUrl} download={item.originalName ?? item.fileName} className="button-ghost">
                        Open file
                      </a>
                    ) : (
                      <span className="caption">Snapshot only</span>
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
