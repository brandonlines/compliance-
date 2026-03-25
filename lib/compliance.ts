import { daysUntil } from "@/lib/format";
import { createId } from "@/lib/store";
import {
  CheckDefinition,
  CheckRun,
  CheckStatus,
  Control,
  ControlStatus,
  Evidence,
  Integration,
  Policy,
  Store,
  Task
} from "@/lib/types";

type CheckOutcome = {
  status: CheckStatus;
  summary: string;
};

type InternalCheck = CheckDefinition & {
  evaluate: (store: Store) => CheckOutcome;
};

function findIntegration(store: Store, integrationId: string) {
  return store.integrations.find((integration) => integration.id === integrationId);
}

function findPolicy(store: Store, policyId: string) {
  return store.policies.find((policy) => policy.id === policyId);
}

function listEvidenceForControl(store: Store, controlId: string) {
  return store.evidence.filter((item) => item.controlId === controlId);
}

function listRunsForControl(store: Store, control: Control) {
  return store.checkRuns.filter(
    (run) => run.controlIds.includes(control.id) || control.testIds.includes(run.checkId)
  );
}

function latestEvidence(items: Evidence[]) {
  return [...items].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))[0];
}

function hasRecentEvidence(store: Store, controlId: string, maxAgeDays: number) {
  const latest = latestEvidence(listEvidenceForControl(store, controlId));

  if (!latest) {
    return false;
  }

  return daysUntil(latest.uploadedAt.slice(0, 10)) >= -maxAgeDays;
}

const internalChecks: InternalCheck[] = [
  {
    id: "check_github_branch_protection",
    title: "GitHub branch protections are enabled",
    description: "Production repositories should enforce branch protection and pull request approvals.",
    severity: "high",
    controlIds: ["control_change"],
    integrationId: "integration_github",
    evaluate(store) {
      const github = findIntegration(store, "integration_github");

      if (!github?.connected) {
        return {
          status: "fail",
          summary: "GitHub is not connected, so branch protections cannot be verified."
        };
      }

      const branchProtectionEnabled = github.settings.branchProtectionEnabled === true;
      const requiresApprovals = github.settings.requiresApprovals === true;

      return branchProtectionEnabled && requiresApprovals
        ? {
            status: "pass",
            summary: "Branch protections and pull request approvals are enabled for tracked repositories."
          }
        : {
            status: "fail",
            summary: "Branch protections or required approvals are missing for at least one tracked repository."
          };
    }
  },
  {
    id: "check_aws_audit_logging",
    title: "AWS audit logging is enabled",
    description: "CloudTrail and AWS Config should be enabled for the production environment.",
    severity: "high",
    controlIds: ["control_logging"],
    integrationId: "integration_aws",
    evaluate(store) {
      const aws = findIntegration(store, "integration_aws");

      if (!aws?.connected) {
        return {
          status: "fail",
          summary: "AWS is not connected, so audit logging coverage cannot be monitored."
        };
      }

      const cloudTrailEnabled = aws.settings.cloudTrailEnabled === true;
      const awsConfigEnabled = aws.settings.awsConfigEnabled === true;

      return cloudTrailEnabled && awsConfigEnabled
        ? {
            status: "pass",
            summary: "CloudTrail and AWS Config are enabled across tracked production accounts."
          }
        : {
            status: "fail",
            summary: "CloudTrail or AWS Config is missing from the tracked production footprint."
          };
    }
  },
  {
    id: "check_google_mfa",
    title: "Google Workspace requires MFA",
    description: "All active user accounts should require multifactor authentication.",
    severity: "high",
    controlIds: ["control_access"],
    integrationId: "integration_google",
    evaluate(store) {
      const google = findIntegration(store, "integration_google");

      if (!google?.connected) {
        return {
          status: "fail",
          summary: "Google Workspace is not connected, so MFA coverage cannot be confirmed."
        };
      }

      return google.settings.mfaRequired === true
        ? {
            status: "pass",
            summary: "MFA is required for the connected Google Workspace tenant."
          }
        : {
            status: "fail",
            summary: "MFA is not currently marked as required in the connected identity environment."
          };
    }
  },
  {
    id: "check_incident_policy_review",
    title: "Incident response policy is reviewed on time",
    description: "The incident response policy should remain within its annual review cycle.",
    severity: "medium",
    controlIds: ["control_incident"],
    evaluate(store) {
      const policy = findPolicy(store, "policy_incident");

      if (!policy) {
        return {
          status: "fail",
          summary: "Incident response policy is missing from the workspace."
        };
      }

      return daysUntil(policy.nextReviewDue) >= 0
        ? {
            status: "pass",
            summary: "Incident response policy remains within its current review window."
          }
        : {
            status: "fail",
            summary: "Incident response policy review is overdue and should be reapproved."
          };
    }
  },
  {
    id: "check_access_review_evidence",
    title: "Access review evidence is fresh",
    description: "Access review evidence should be refreshed at least every 90 days.",
    severity: "medium",
    controlIds: ["control_access"],
    evaluate(store) {
      return hasRecentEvidence(store, "control_access", 90)
        ? {
            status: "pass",
            summary: "Access review evidence is recent enough for the current audit period."
          }
        : {
            status: "fail",
            summary: "Access review evidence is stale or missing for the past 90 days."
          };
    }
  },
  {
    id: "check_training_evidence",
    title: "Security awareness evidence is current",
    description: "Annual security awareness training evidence should be refreshed every 365 days.",
    severity: "medium",
    controlIds: ["control_training"],
    evaluate(store) {
      return hasRecentEvidence(store, "control_training", 365)
        ? {
            status: "pass",
            summary: "Security awareness training evidence is current."
          }
        : {
            status: "fail",
            summary: "Security awareness training evidence is stale or missing."
          };
    }
  },
  {
    id: "check_vendor_review_evidence",
    title: "Vendor reviews have recent evidence",
    description: "Critical vendor review evidence should be refreshed at least every 180 days.",
    severity: "low",
    controlIds: ["control_vendor"],
    evaluate(store) {
      return hasRecentEvidence(store, "control_vendor", 180)
        ? {
            status: "pass",
            summary: "Vendor review evidence is recent enough for tracked critical vendors."
          }
        : {
            status: "fail",
            summary: "Vendor review evidence is stale or missing for the last 180 days."
          };
    }
  }
];

export const CHECK_LIBRARY: CheckDefinition[] = internalChecks.map(({ evaluate, ...check }) => check);

export function getLatestRunsByCheck(store: Store) {
  const map = new Map<string, CheckRun>();

  for (const run of [...store.checkRuns].sort((left, right) => right.ranAt.localeCompare(left.ranAt))) {
    if (!map.has(run.checkId)) {
      map.set(run.checkId, run);
    }
  }

  return map;
}

export function getControlStatus(control: Control, store: Store): ControlStatus {
  const latestRuns = getLatestRunsByCheck(store);
  const hasEvidence = listEvidenceForControl(store, control.id).length > 0;
  const relevantPolicies = control.policyIds
    .map((policyId) => findPolicy(store, policyId))
    .filter((policy): policy is Policy => Boolean(policy));
  const hasOverduePolicy = relevantPolicies.some((policy) => daysUntil(policy.nextReviewDue) < 0);
  const controlRuns = listRunsForControl(store, control).sort((left, right) => right.ranAt.localeCompare(left.ranAt));
  const failingRun = controlRuns.find((run) => run.status === "fail");
  const missingRuns = controlRuns.length === 0;

  if (!hasEvidence || hasOverduePolicy || failingRun) {
    return "attention";
  }

  if (missingRuns) {
    return "monitoring";
  }

  return "ready";
}

export function getControlsByStatus(store: Store) {
  return store.controls.reduce(
    (accumulator, control) => {
      accumulator[getControlStatus(control, store)] += 1;
      return accumulator;
    },
    {
      ready: 0,
      monitoring: 0,
      attention: 0
    }
  );
}

export function getLatestRunForControl(control: Control, store: Store) {
  const latestRuns = getLatestRunsByCheck(store);
  const runs = [
    ...control.testIds.map((testId) => latestRuns.get(testId)).filter((run): run is CheckRun => Boolean(run)),
    ...listRunsForControl(store, control)
  ].sort((left, right) => right.ranAt.localeCompare(left.ranAt));

  return runs[0];
}

export function getDashboardMetrics(store: Store) {
  const counts = getControlsByStatus(store);
  const latestRuns = [...getLatestRunsByCheck(store).values()];
  const passingRuns = latestRuns.filter((run) => run.status === "pass").length;
  const passRate = latestRuns.length === 0 ? 0 : Math.round((passingRuns / latestRuns.length) * 100);
  const readinessScore = Math.round((counts.ready / store.controls.length) * 100);
  const overduePolicies = store.policies.filter((policy) => daysUntil(policy.nextReviewDue) < 0).length;
  const openTasks = store.tasks.filter((task) => task.status !== "done").length;

  return {
    readinessScore,
    passRate,
    overduePolicies,
    openTasks,
    counts
  };
}

function createRemediationTask(run: CheckRun, store: Store): Task {
  const owner = run.controlIds
    .map((controlId) => store.controls.find((control) => control.id === controlId)?.owner)
    .find((value): value is string => Boolean(value)) ?? store.organization.owner;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  return {
    id: createId("task"),
    title: `Remediate: ${run.title}`,
    description: run.summary,
    owner,
    dueDate: dueDate.toISOString().slice(0, 10),
    status: "open",
    priority: run.severity,
    sourceType: "check",
    sourceId: run.checkId,
    createdAt: run.ranAt
  };
}

export function applyCheckRunsToStore(store: Store, runs: CheckRun[]) {
  let tasks = [...store.tasks];

  for (const run of runs) {
    const existingIndex = tasks.findIndex(
      (task) => task.sourceType === "check" && task.sourceId === run.checkId && task.status !== "done"
    );

    if (run.status === "fail") {
      if (existingIndex === -1) {
        tasks = [createRemediationTask(run, store), ...tasks];
      } else {
        const existing = tasks[existingIndex];
        tasks[existingIndex] = {
          ...existing,
          description: run.summary,
          dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
          priority: run.severity
        };
      }
    } else {
      tasks = tasks.map((task) =>
        task.sourceType === "check" && task.sourceId === run.checkId && task.status !== "done"
          ? {
              ...task,
              status: "done",
              completedAt: run.ranAt
            }
          : task
      );
    }
  }

  return {
    ...store,
    tasks,
    checkRuns: [...runs, ...store.checkRuns].slice(0, 120)
  };
}

export function runAllChecks(store: Store) {
  const ranAt = new Date().toISOString();
  const runs: CheckRun[] = internalChecks.map((check) => {
    const outcome = check.evaluate(store);

    return {
      id: createId("run"),
      checkId: check.id,
      title: check.title,
      description: check.description,
      status: outcome.status,
      summary: outcome.summary,
      severity: check.severity,
      controlIds: check.controlIds,
      ranAt,
      source: "internal"
    };
  });

  const integrations = store.integrations.map((integration) =>
    integration.connected
      ? {
          ...integration,
          lastSync: ranAt
        }
      : integration
  );

  return {
    ...applyCheckRunsToStore(store, runs),
    integrations,
    automation: store.automation
  };
}

export function buildAuditorPacket(store: Store) {
  const latestRuns = getLatestRunsByCheck(store);
  const metrics = getDashboardMetrics(store);
  const timestamps = [
    store.automation.lastEventAt,
    ...store.evidence.map((item) => item.uploadedAt),
    ...store.checkRuns.map((run) => run.ranAt),
    ...store.tasks.map((task) => task.createdAt),
    ...store.workflowRuns.map((run) => run.ranAt)
  ].filter((value): value is string => Boolean(value));
  const generatedAt = [...timestamps].sort((left, right) => right.localeCompare(left))[0] ?? "2026-03-20T09:00:00.000Z";

  return {
    generatedAt,
    organization: store.organization,
    summary: metrics,
    controls: store.controls.map((control) => ({
      id: control.id,
      code: control.code,
      title: control.title,
      owner: control.owner,
      family: control.family,
      cadence: control.cadence,
      status: getControlStatus(control, store),
      evidenceCount: listEvidenceForControl(store, control.id).length,
      policies: control.policyIds
        .map((policyId) => findPolicy(store, policyId))
        .filter((policy): policy is Policy => Boolean(policy))
        .map((policy) => ({
          title: policy.title,
          lastReviewed: policy.lastReviewed,
          nextReviewDue: policy.nextReviewDue
        })),
      latestChecks: listRunsForControl(store, control)
        .sort((left, right) => right.ranAt.localeCompare(left.ranAt))
        .slice(0, 5)
        .map((run) => ({
          title: run.title,
          status: run.status,
          ranAt: run.ranAt,
          summary: run.summary,
          source: run.sourceName ?? run.source
        }))
    })),
    evidence: [...store.evidence].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt)),
    policies: [...store.policies].sort((left, right) => left.nextReviewDue.localeCompare(right.nextReviewDue)),
    integrations: [...store.integrations].sort((left, right) => left.name.localeCompare(right.name)),
    openTasks: store.tasks.filter((task) => task.status !== "done"),
    recentChecks: [...latestRuns.values()].sort((left, right) => right.ranAt.localeCompare(left.ranAt)),
    recentWorkflows: [...store.workflowRuns].sort((left, right) => right.ranAt.localeCompare(left.ranAt)).slice(0, 8)
  };
}

export function getEvidenceForControl(controlId: string, store: Store) {
  return listEvidenceForControl(store, controlId).sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
}

export function getPolicyStatus(policy: Policy) {
  const days = daysUntil(policy.nextReviewDue);

  if (days < 0) {
    return "attention";
  }

  if (days <= 30) {
    return "monitoring";
  }

  return "ready";
}

export function getIntegrationHealth(integration: Integration) {
  if (!integration.connected) {
    return "attention";
  }

  if (!integration.lastSync) {
    return "monitoring";
  }

  return "ready";
}
