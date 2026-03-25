import { getLatestRunsByCheck, runAllChecks } from "@/lib/compliance";
import { daysUntil, pluralize } from "@/lib/format";
import { createId, normalizeStore } from "@/lib/store";
import { Store, Task, WorkflowRun, WorkflowRunStatus, WorkflowTemplateId } from "@/lib/types";

type WorkflowTemplate = {
  id: WorkflowTemplateId;
  title: string;
  cadence: string;
  description: string;
  steps: string[];
};

type WorkflowExecution = {
  store: Store;
  summary: string;
  status: WorkflowRunStatus;
  taskCount: number;
  evidenceCount: number;
  checkCount: number;
};

const evidenceRefreshRules = [
  {
    controlId: "control_access",
    maxAgeDays: 90,
    title: "Refresh access review evidence",
    description: "Upload a new access review export for the current audit period."
  },
  {
    controlId: "control_training",
    maxAgeDays: 365,
    title: "Refresh security awareness evidence",
    description: "Upload the latest training completion report for active teammates."
  },
  {
    controlId: "control_vendor",
    maxAgeDays: 180,
    title: "Refresh vendor review evidence",
    description: "Upload the latest due diligence review for critical vendors."
  }
] as const;

export const WORKFLOW_LIBRARY: WorkflowTemplate[] = [
  {
    id: "quarterly_access_review",
    title: "Quarterly access review",
    cadence: "Quarterly",
    description: "Queue the ownership and evidence work needed to complete an access review cycle.",
    steps: [
      "Create or refresh the open access review task.",
      "Assign ownership to the access control team.",
      "Use the result to drive an evidence upload or automation payload."
    ]
  },
  {
    id: "policy_review_sweep",
    title: "Policy review sweep",
    cadence: "Monthly",
    description: "Scan for policies due soon or overdue and create follow-up tasks before they slip.",
    steps: [
      "Find policies due within the next 30 days.",
      "Create one task per policy that still needs review.",
      "Keep existing open workflow tasks instead of duplicating them."
    ]
  },
  {
    id: "evidence_refresh_sweep",
    title: "Evidence refresh sweep",
    cadence: "Monthly",
    description: "Create evidence collection tasks for controls whose artifacts are stale.",
    steps: [
      "Inspect evidence freshness windows for key controls.",
      "Create targeted upload tasks where evidence is stale or missing.",
      "Keep the remediation queue aligned with audit-readiness gaps."
    ]
  },
  {
    id: "control_monitoring_cycle",
    title: "Control monitoring cycle",
    cadence: "Weekly",
    description: "Run the full check library and let remediation tasks update automatically.",
    steps: [
      "Execute all current monitoring checks.",
      "Refresh integration sync timestamps.",
      "Open or close remediation tasks based on current results."
    ]
  }
];

function todayPlusDays(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function upsertWorkflowTask(store: Store, task: Task) {
  const existingIndex = store.tasks.findIndex(
    (current) => current.sourceType === "workflow" && current.sourceId === task.sourceId && current.status !== "done"
  );

  if (existingIndex === -1) {
    return {
      store: {
        ...store,
        tasks: [task, ...store.tasks]
      },
      created: true,
      taskId: task.id
    };
  }

  const tasks = [...store.tasks];
  const existing = tasks[existingIndex];
  tasks[existingIndex] = {
    ...existing,
    title: task.title,
    description: task.description,
    owner: task.owner,
    dueDate: task.dueDate,
    priority: task.priority
  };

  return {
    store: {
      ...store,
      tasks
    },
    created: false,
    taskId: existing.id
  };
}

function latestEvidenceAgeDays(store: Store, controlId: string) {
  const latest = [...store.evidence]
    .filter((item) => item.controlId === controlId)
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))[0];

  if (!latest) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(daysUntil(latest.uploadedAt.slice(0, 10)));
}

function appendWorkflowRun(store: Store, run: WorkflowRun) {
  return normalizeStore({
    ...store,
    workflowRuns: [run, ...store.workflowRuns].slice(0, 30)
  });
}

function workflowTemplateById(templateId: WorkflowTemplateId) {
  return WORKFLOW_LIBRARY.find((template) => template.id === templateId);
}

function runQuarterlyAccessReview(store: Store): WorkflowExecution {
  const accessControl = store.controls.find((control) => control.id === "control_access");

  if (!accessControl) {
    return {
      store,
      summary: "Access review control is missing from the workspace.",
      status: "warning",
      taskCount: 0,
      evidenceCount: 0,
      checkCount: 0
    };
  }

  const result = upsertWorkflowTask(store, {
    id: createId("task"),
    title: "Run quarterly access review",
    description: "Review active users, privileged accounts, and terminated-user cleanup, then upload the resulting evidence.",
    owner: accessControl.owner,
    dueDate: todayPlusDays(14),
    status: "open",
    priority: "high",
    sourceType: "workflow",
    sourceId: "workflow_quarterly_access_review",
    createdAt: new Date().toISOString()
  });

  return {
    store: result.store,
    summary: result.created
      ? "Queued the quarterly access review task."
      : "Quarterly access review was already in the remediation queue.",
    status: result.created ? "success" : "warning",
    taskCount: result.created ? 1 : 0,
    evidenceCount: 0,
    checkCount: 0
  };
}

function runPolicyReviewSweep(store: Store): WorkflowExecution {
  const duePolicies = store.policies.filter((policy) => daysUntil(policy.nextReviewDue) <= 30);

  if (duePolicies.length === 0) {
    return {
      store,
      summary: "No policies are due for review in the next 30 days.",
      status: "warning",
      taskCount: 0,
      evidenceCount: 0,
      checkCount: 0
    };
  }

  let nextStore = store;
  let createdTasks = 0;

  for (const policy of duePolicies) {
    const result = upsertWorkflowTask(nextStore, {
      id: createId("task"),
      title: `Review ${policy.title}`,
      description: "Reapprove this policy and record the latest review date before the next audit sample.",
      owner: policy.owner,
      dueDate: daysUntil(policy.nextReviewDue) < 0 ? todayPlusDays(7) : policy.nextReviewDue,
      status: "open",
      priority: daysUntil(policy.nextReviewDue) < 0 ? "high" : "medium",
      sourceType: "workflow",
      sourceId: `workflow_policy_review_${policy.id}`,
      createdAt: new Date().toISOString()
    });

    nextStore = result.store;

    if (result.created) {
      createdTasks += 1;
    }
  }

  return {
    store: nextStore,
    summary:
      createdTasks > 0
        ? `Queued ${pluralize(createdTasks, "policy review task")} for due or overdue policies.`
        : "Policy review tasks were already open for every policy currently in scope.",
    status: createdTasks > 0 ? "success" : "warning",
    taskCount: createdTasks,
    evidenceCount: 0,
    checkCount: 0
  };
}

function runEvidenceRefreshSweep(store: Store): WorkflowExecution {
  let nextStore = store;
  let createdTasks = 0;

  for (const rule of evidenceRefreshRules) {
    if (latestEvidenceAgeDays(nextStore, rule.controlId) <= rule.maxAgeDays) {
      continue;
    }

    const control = nextStore.controls.find((item) => item.id === rule.controlId);

    if (!control) {
      continue;
    }

    const result = upsertWorkflowTask(nextStore, {
      id: createId("task"),
      title: rule.title,
      description: rule.description,
      owner: control.owner,
      dueDate: todayPlusDays(10),
      status: "open",
      priority: "medium",
      sourceType: "workflow",
      sourceId: `workflow_evidence_refresh_${rule.controlId}`,
      createdAt: new Date().toISOString()
    });

    nextStore = result.store;

    if (result.created) {
      createdTasks += 1;
    }
  }

  return {
    store: nextStore,
    summary:
      createdTasks > 0
        ? `Queued ${pluralize(createdTasks, "evidence refresh task")} for stale controls.`
        : "Evidence freshness tasks were already open or all tracked evidence is current.",
    status: createdTasks > 0 ? "success" : "warning",
    taskCount: createdTasks,
    evidenceCount: 0,
    checkCount: 0
  };
}

function runControlMonitoringCycle(store: Store): WorkflowExecution {
  const nextStore = runAllChecks(store);
  const latestRuns = [...getLatestRunsByCheck(nextStore).values()];
  const failingRuns = latestRuns.filter((run) => run.status === "fail").length;

  return {
    store: nextStore,
    summary:
      failingRuns > 0
        ? `Ran ${pluralize(latestRuns.length, "check")} and found ${pluralize(failingRuns, "failing result")}.`
        : `Ran ${pluralize(latestRuns.length, "check")} and all current results passed.`,
    status: failingRuns > 0 ? "warning" : "success",
    taskCount: nextStore.tasks.filter((task) => task.sourceType === "check" && task.status !== "done").length,
    evidenceCount: 0,
    checkCount: latestRuns.length
  };
}

export function runWorkflowTemplate(store: Store, templateId: WorkflowTemplateId, actorName: string) {
  const template = workflowTemplateById(templateId);

  if (!template) {
    return {
      store,
      summary: "Unknown workflow template.",
      ok: false
    };
  }

  const execution =
    templateId === "quarterly_access_review"
      ? runQuarterlyAccessReview(store)
      : templateId === "policy_review_sweep"
        ? runPolicyReviewSweep(store)
        : templateId === "evidence_refresh_sweep"
          ? runEvidenceRefreshSweep(store)
          : runControlMonitoringCycle(store);

  const run: WorkflowRun = {
    id: createId("workflow"),
    templateId,
    title: template.title,
    summary: execution.summary,
    status: execution.status,
    actorName,
    ranAt: new Date().toISOString(),
    taskCount: execution.taskCount,
    evidenceCount: execution.evidenceCount,
    checkCount: execution.checkCount
  };

  return {
    store: appendWorkflowRun(execution.store, run),
    summary: execution.summary,
    ok: true
  };
}
