import { AutomationPayload, ingestAutomationPayload } from "@/lib/automation";
import { runAllChecks } from "@/lib/compliance";
import { createAutomationSecret, createId, normalizeStore } from "@/lib/store";
import { Integration, Severity, Store, TaskStatus } from "@/lib/types";

export type UploadEvidenceInput = {
  title: string;
  description: string;
  owner: string;
  controlId: string;
  policyId?: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  fileDataUrl?: string;
};

export type CreateTaskInput = {
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  priority: Severity;
};

export type SaveIntegrationInput = {
  integrationId: string;
  owner: string;
  connected: boolean;
  settings: Record<string, boolean | string>;
};

export type StoreAction =
  | {
      type: "runChecks";
    }
  | {
      type: "reviewPolicy";
      policyId: string;
      reviewDate: string;
    }
  | {
      type: "saveIntegration";
      input: SaveIntegrationInput;
    }
  | {
      type: "updateTaskStatus";
      taskId: string;
      status: TaskStatus;
    }
  | {
      type: "createTask";
      input: CreateTaskInput;
    }
  | {
      type: "updateAutomationEnabled";
      enabled: boolean;
    }
  | {
      type: "rotateAutomationSecret";
    }
  | {
      type: "applyAutomationPayload";
      payload: AutomationPayload;
    }
  | {
      type: "resetDemo";
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function isSeverity(value: unknown): value is Severity {
  return value === "low" || value === "medium" || value === "high";
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "open" || value === "in_progress" || value === "done";
}

function isSettingsRecord(value: unknown): value is Record<string, boolean | string> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => typeof entry === "boolean" || typeof entry === "string")
  );
}

function hasControl(store: Store, controlId: string) {
  return store.controls.some((control) => control.id === controlId);
}

function hasPolicy(store: Store, policyId: string) {
  return store.policies.some((policy) => policy.id === policyId);
}

function hasIntegration(store: Store, integrationId: string) {
  return store.integrations.some((integration) => integration.id === integrationId);
}

function hasTask(store: Store, taskId: string) {
  return store.tasks.some((task) => task.id === taskId);
}

function isAutomationPayload(value: unknown): value is AutomationPayload {
  return (
    isRecord(value) &&
    (value.type === "evidence.create" || value.type === "check.report" || value.type === "task.create")
  );
}

export function parseStoreAction(input: unknown): StoreAction | null {
  if (!isRecord(input) || typeof input.type !== "string") {
    return null;
  }

  if (input.type === "runChecks" || input.type === "rotateAutomationSecret" || input.type === "resetDemo") {
    return {
      type: input.type
    };
  }

  if (input.type === "reviewPolicy") {
    return {
      type: "reviewPolicy",
      policyId: asTrimmedString(input.policyId),
      reviewDate: asTrimmedString(input.reviewDate)
    };
  }

  if (input.type === "saveIntegration") {
    if (!isRecord(input.input) || !isSettingsRecord(input.input.settings)) {
      return null;
    }

    return {
      type: "saveIntegration",
      input: {
        integrationId: asTrimmedString(input.input.integrationId),
        owner: asTrimmedString(input.input.owner),
        connected: input.input.connected === true,
        settings: input.input.settings
      }
    };
  }

  if (input.type === "updateTaskStatus") {
    return {
      type: "updateTaskStatus",
      taskId: asTrimmedString(input.taskId),
      status: input.status as TaskStatus
    };
  }

  if (input.type === "createTask") {
    if (!isRecord(input.input)) {
      return null;
    }

    return {
      type: "createTask",
      input: {
        title: asTrimmedString(input.input.title),
        description: asTrimmedString(input.input.description),
        owner: asTrimmedString(input.input.owner),
        dueDate: asTrimmedString(input.input.dueDate),
        priority: input.input.priority as Severity
      }
    };
  }

  if (input.type === "updateAutomationEnabled") {
    return {
      type: "updateAutomationEnabled",
      enabled: input.enabled === true
    };
  }

  if (input.type === "applyAutomationPayload") {
    if (!isAutomationPayload(input.payload)) {
      return null;
    }

    return {
      type: "applyAutomationPayload",
      payload: input.payload
    };
  }

  return null;
}

export function validateStoreAction(store: Store, action: StoreAction) {
  if (action.type === "runChecks" || action.type === "rotateAutomationSecret" || action.type === "resetDemo") {
    return null;
  }

  if (action.type === "reviewPolicy") {
    if (!action.policyId || !hasPolicy(store, action.policyId)) {
      return "Unknown policy.";
    }

    if (!isValidDateInput(action.reviewDate)) {
      return "Review date must be a valid YYYY-MM-DD value.";
    }

    return null;
  }

  if (action.type === "saveIntegration") {
    if (!action.input.integrationId || !hasIntegration(store, action.input.integrationId)) {
      return "Unknown integration.";
    }

    if (!action.input.owner) {
      return "Integration owner is required.";
    }

    return null;
  }

  if (action.type === "updateTaskStatus") {
    if (!action.taskId || !hasTask(store, action.taskId)) {
      return "Unknown task.";
    }

    if (!isTaskStatus(action.status)) {
      return "Task status is invalid.";
    }

    return null;
  }

  if (action.type === "createTask") {
    if (!action.input.title || !action.input.owner) {
      return "Task title and owner are required.";
    }

    if (!isValidDateInput(action.input.dueDate)) {
      return "Task due date must be a valid YYYY-MM-DD value.";
    }

    if (!isSeverity(action.input.priority)) {
      return "Task priority is invalid.";
    }

    return null;
  }

  if (action.type === "updateAutomationEnabled") {
    return typeof action.enabled === "boolean" ? null : "Automation enabled must be a boolean.";
  }

  if (!isAutomationPayload(action.payload)) {
    return "Automation payload is invalid.";
  }

  return null;
}

export function validateEvidenceInput(store: Store, input: UploadEvidenceInput) {
  if (!input.title || !input.owner || !input.controlId) {
    return "Missing required evidence fields.";
  }

  if (!hasControl(store, input.controlId)) {
    return "Unknown control.";
  }

  if (input.policyId && !hasPolicy(store, input.policyId)) {
    return "Unknown policy.";
  }

  return null;
}

function formatLocalDate(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0")
  ].join("-");
}

function updateIntegrationSettings(integration: Integration, input: SaveIntegrationInput) {
  return {
    ...integration,
    connected: input.connected,
    owner: input.owner || integration.owner,
    lastSync: new Date().toISOString(),
    settings: {
      ...integration.settings,
      ...input.settings
    }
  };
}

export function appendEvidence(store: Store, input: UploadEvidenceInput) {
  return normalizeStore({
    ...store,
    evidence: [
      {
        id: createId("evidence"),
        title: input.title,
        description: input.description,
        owner: input.owner,
        kind: input.fileDataUrl ? "upload" : "snapshot",
        source: "manual",
        controlId: input.controlId,
        policyId: input.policyId || undefined,
        uploadedAt: new Date().toISOString(),
        fileName: input.fileName,
        originalName: input.originalName,
        mimeType: input.mimeType,
        fileDataUrl: input.fileDataUrl
      },
      ...store.evidence
    ]
  });
}

export function applyStoreAction(store: Store, action: Exclude<StoreAction, { type: "resetDemo" }>) {
  if (action.type === "runChecks") {
    return {
      store: runAllChecks(store)
    };
  }

  if (action.type === "reviewPolicy") {
    const nextReview = new Date(`${action.reviewDate}T12:00:00`);
    nextReview.setFullYear(nextReview.getFullYear() + 1);

    return {
      store: normalizeStore({
        ...store,
        policies: store.policies.map((policy) =>
          policy.id === action.policyId
            ? {
                ...policy,
                lastReviewed: action.reviewDate,
                nextReviewDue: formatLocalDate(nextReview)
              }
            : policy
        )
      })
    };
  }

  if (action.type === "saveIntegration") {
    return {
      store: normalizeStore({
        ...store,
        integrations: store.integrations.map((integration) =>
          integration.id === action.input.integrationId ? updateIntegrationSettings(integration, action.input) : integration
        )
      })
    };
  }

  if (action.type === "updateTaskStatus") {
    return {
      store: normalizeStore({
        ...store,
        tasks: store.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                status: action.status,
                completedAt: action.status === "done" ? new Date().toISOString() : undefined
              }
            : task
        )
      })
    };
  }

  if (action.type === "createTask") {
    return {
      store: normalizeStore({
        ...store,
        tasks: [
          {
            id: createId("task"),
            title: action.input.title,
            description: action.input.description,
            owner: action.input.owner,
            dueDate: action.input.dueDate,
            status: "open",
            priority: action.input.priority,
            sourceType: "manual",
            createdAt: new Date().toISOString()
          },
          ...store.tasks
        ]
      })
    };
  }

  if (action.type === "updateAutomationEnabled") {
    return {
      store: normalizeStore({
        ...store,
        automation: {
          ...store.automation,
          enabled: action.enabled
        }
      })
    };
  }

  if (action.type === "rotateAutomationSecret") {
    return {
      store: normalizeStore({
        ...store,
        automation: {
          ...store.automation,
          secret: createAutomationSecret()
        }
      })
    };
  }

  const result = ingestAutomationPayload(store, action.payload);

  return {
    store: normalizeStore(result.store),
    ok: result.ok,
    summary: result.summary
  };
}
