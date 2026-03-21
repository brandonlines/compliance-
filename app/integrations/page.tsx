"use client";

import { FormEvent } from "react";
import Link from "next/link";

import { useAppStore } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import { getIntegrationHealth } from "@/lib/compliance";
import { formatDate } from "@/lib/format";

export default function IntegrationsPage() {
  const { store, saveIntegration } = useAppStore();
  const integrations = [...store.integrations].sort((left, right) => left.name.localeCompare(right.name));

  function handleSubmit(integrationId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const owner = String(data.get("owner") ?? "").trim();
    const connected = data.get("connected") === "on";

    if (integrationId === "integration_github") {
      saveIntegration({
        integrationId,
        owner,
        connected,
        settings: {
          branchProtectionEnabled: data.get("branchProtectionEnabled") === "on",
          requiresApprovals: data.get("requiresApprovals") === "on",
          repositoryCount: String(data.get("repositoryCount") ?? "0")
        }
      });
      return;
    }

    if (integrationId === "integration_aws") {
      saveIntegration({
        integrationId,
        owner,
        connected,
        settings: {
          cloudTrailEnabled: data.get("cloudTrailEnabled") === "on",
          awsConfigEnabled: data.get("awsConfigEnabled") === "on",
          productionAccounts: String(data.get("productionAccounts") ?? "0")
        }
      });
      return;
    }

    saveIntegration({
      integrationId,
      owner,
      connected,
      settings: {
        mfaRequired: data.get("mfaRequired") === "on",
        ssoEnabled: data.get("ssoEnabled") === "on",
        userCount: String(data.get("userCount") ?? "0")
      }
    });
  }

  return (
    <section className="stack">
      <header>
        <p className="eyebrow">Integrations</p>
        <h2 className="page-title">Signal sources</h2>
        <p className="muted">Keep the demo intentionally small: identity, source control, and cloud.</p>
        <div className="hero-actions">
          <Link href="/automation" className="button-ghost">
            Open automation studio
          </Link>
        </div>
      </header>

      <section className="grid-3">
        {integrations.map((integration) => (
          <article key={integration.id} className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{integration.category}</p>
                <h3>{integration.name}</h3>
              </div>
              <StatusBadge tone={getIntegrationHealth(integration)} />
            </div>
            <p className="muted">{integration.description}</p>
            <div className="detail-row">
              <span>Owner {integration.owner}</span>
              <span>Last sync {formatDate(integration.lastSync)}</span>
            </div>

            <form onSubmit={(event) => handleSubmit(integration.id, event)} className="form-grid section-gap">
              <div className="field">
                <label htmlFor={`${integration.id}-owner`}>Owner</label>
                <input id={`${integration.id}-owner`} name="owner" defaultValue={integration.owner} />
              </div>
              <div className="field checkbox-row">
                <input
                  id={`${integration.id}-connected`}
                  name="connected"
                  type="checkbox"
                  defaultChecked={integration.connected}
                />
                <label htmlFor={`${integration.id}-connected`}>Connected</label>
              </div>

              {integration.id === "integration_github" && (
                <>
                  <div className="field checkbox-row">
                    <input
                      id={`${integration.id}-branchProtectionEnabled`}
                      name="branchProtectionEnabled"
                      type="checkbox"
                      defaultChecked={integration.settings.branchProtectionEnabled === true}
                    />
                    <label htmlFor={`${integration.id}-branchProtectionEnabled`}>Branch protection enabled</label>
                  </div>
                  <div className="field checkbox-row">
                    <input
                      id={`${integration.id}-requiresApprovals`}
                      name="requiresApprovals"
                      type="checkbox"
                      defaultChecked={integration.settings.requiresApprovals === true}
                    />
                    <label htmlFor={`${integration.id}-requiresApprovals`}>Approvals required</label>
                  </div>
                  <div className="field field-full">
                    <label htmlFor={`${integration.id}-repositoryCount`}>Repository count</label>
                    <input
                      id={`${integration.id}-repositoryCount`}
                      name="repositoryCount"
                      defaultValue={String(integration.settings.repositoryCount ?? "")}
                    />
                  </div>
                </>
              )}

              {integration.id === "integration_aws" && (
                <>
                  <div className="field checkbox-row">
                    <input
                      id={`${integration.id}-cloudTrailEnabled`}
                      name="cloudTrailEnabled"
                      type="checkbox"
                      defaultChecked={integration.settings.cloudTrailEnabled === true}
                    />
                    <label htmlFor={`${integration.id}-cloudTrailEnabled`}>CloudTrail enabled</label>
                  </div>
                  <div className="field checkbox-row">
                    <input
                      id={`${integration.id}-awsConfigEnabled`}
                      name="awsConfigEnabled"
                      type="checkbox"
                      defaultChecked={integration.settings.awsConfigEnabled === true}
                    />
                    <label htmlFor={`${integration.id}-awsConfigEnabled`}>AWS Config enabled</label>
                  </div>
                  <div className="field field-full">
                    <label htmlFor={`${integration.id}-productionAccounts`}>Production accounts</label>
                    <input
                      id={`${integration.id}-productionAccounts`}
                      name="productionAccounts"
                      defaultValue={String(integration.settings.productionAccounts ?? "")}
                    />
                  </div>
                </>
              )}

              {integration.id === "integration_google" && (
                <>
                  <div className="field checkbox-row">
                    <input
                      id={`${integration.id}-mfaRequired`}
                      name="mfaRequired"
                      type="checkbox"
                      defaultChecked={integration.settings.mfaRequired === true}
                    />
                    <label htmlFor={`${integration.id}-mfaRequired`}>MFA required</label>
                  </div>
                  <div className="field checkbox-row">
                    <input
                      id={`${integration.id}-ssoEnabled`}
                      name="ssoEnabled"
                      type="checkbox"
                      defaultChecked={integration.settings.ssoEnabled === true}
                    />
                    <label htmlFor={`${integration.id}-ssoEnabled`}>SSO enabled</label>
                  </div>
                  <div className="field field-full">
                    <label htmlFor={`${integration.id}-userCount`}>User count</label>
                    <input
                      id={`${integration.id}-userCount`}
                      name="userCount"
                      defaultValue={String(integration.settings.userCount ?? "")}
                    />
                  </div>
                </>
              )}

              <div className="inline-actions field-full">
                <button type="submit" className="button">
                  Save integration
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </section>
  );
}
