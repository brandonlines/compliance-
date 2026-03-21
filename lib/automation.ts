import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { applyCheckRunsToStore } from "@/lib/compliance";
import { createId, uploadsDirectory } from "@/lib/store";
import {
  AutomationEvent,
  AutomationEventType,
  CheckRun,
  CheckStatus,
  Severity,
  Store
} from "@/lib/types";

type EvidenceCreatePayload = {
  type: "evidence.create";
  title: string;
  description?: string;
  owner: string;
  controlId: string;
  policyId?: string;
  sourceName?: string;
  uploadedAt?: string;
  fileName?: string;
  mimeType?: string;
  contentBase64?: string;
};

type CheckReportPayload = {
  type: "check.report";
  checkId: string;
  title: string;
  description?: string;
  status: CheckStatus;
  summary: string;
  severity?: Severity;
  controlIds: string[];
  sourceName?: string;
  ranAt?: string;
};

type TaskCreatePayload = {
  type: "task.create";
  title: string;
  description?: string;
  owner: string;
  dueDate: string;
  priority?: Severity;
  sourceName?: string;
};

export type AutomationPayload = EvidenceCreatePayload | CheckReportPayload | TaskCreatePayload;

type IngestResult = {
  ok: boolean;
  status: number;
  summary: string;
  store: Store;
};

function addAutomationEvent(
  store: Store,
  type: AutomationEventType,
  status: AutomationEvent["status"],
  source: string,
  summary: string,
  receivedAt: string
) {
  const event: AutomationEvent = {
    id: createId("automation"),
    type,
    status,
    source,
    summary,
    receivedAt
  };

  return {
    ...store,
    automation: {
      ...store.automation,
      lastEventAt: receivedAt,
      events: [event, ...store.automation.events].slice(0, 30)
    }
  };
}

function ensureControlExists(store: Store, controlId: string) {
  return store.controls.some((control) => control.id === controlId);
}

function defaultSourceName(value: string | undefined) {
  return value?.trim() || "external automation";
}

function decodeFile(contentBase64: string) {
  try {
    return Buffer.from(contentBase64, "base64");
  } catch {
    return null;
  }
}

async function handleEvidenceCreate(store: Store, payload: EvidenceCreatePayload, receivedAt: string): Promise<IngestResult> {
  if (!payload.title || !payload.owner || !payload.controlId) {
    const rejected = addAutomationEvent(
      store,
      payload.type,
      "rejected",
      defaultSourceName(payload.sourceName),
      "Evidence payload is missing a title, owner, or controlId.",
      receivedAt
    );

    return {
      ok: false,
      status: 400,
      summary: "Evidence payload is missing required fields.",
      store: rejected
    };
  }

  if (!ensureControlExists(store, payload.controlId)) {
    const rejected = addAutomationEvent(
      store,
      payload.type,
      "rejected",
      defaultSourceName(payload.sourceName),
      `Evidence payload referenced unknown control ${payload.controlId}.`,
      receivedAt
    );

    return {
      ok: false,
      status: 400,
      summary: "Unknown controlId.",
      store: rejected
    };
  }

  let filePath: string | undefined;
  let fileName: string | undefined;
  let originalName: string | undefined;
  let mimeType: string | undefined;
  let kind: "upload" | "snapshot" = "snapshot";

  if (payload.fileName && payload.contentBase64) {
    const decoded = decodeFile(payload.contentBase64);

    if (!decoded) {
      const rejected = addAutomationEvent(
        store,
        payload.type,
        "rejected",
        defaultSourceName(payload.sourceName),
        "Evidence payload included invalid base64 content.",
        receivedAt
      );

      return {
        ok: false,
        status: 400,
        summary: "Invalid base64 file content.",
        store: rejected
      };
    }

    await mkdir(uploadsDirectory, { recursive: true });
    fileName = `${Date.now()}-${payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    filePath = path.join(uploadsDirectory, fileName);
    originalName = payload.fileName;
    mimeType = payload.mimeType || "application/octet-stream";
    await writeFile(filePath, decoded);
    kind = "upload";
  }

  const updated = addAutomationEvent(
    {
      ...store,
      evidence: [
        {
          id: createId("evidence"),
          title: payload.title,
          description: payload.description ?? "",
          owner: payload.owner,
          kind,
          source: "automation",
          controlId: payload.controlId,
          policyId: payload.policyId,
          uploadedAt: payload.uploadedAt ?? receivedAt,
          filePath,
          fileName,
          originalName,
          mimeType
        },
        ...store.evidence
      ]
    },
    payload.type,
    "accepted",
    defaultSourceName(payload.sourceName),
    `Evidence stored for control ${payload.controlId}.`,
    receivedAt
  );

  return {
    ok: true,
    status: 202,
    summary: "Evidence event accepted.",
    store: updated
  };
}

function handleCheckReport(store: Store, payload: CheckReportPayload, receivedAt: string): IngestResult {
  const controlIds = Array.isArray(payload.controlIds) ? payload.controlIds : [];
  const status = payload.status === "pass" || payload.status === "fail" ? payload.status : null;

  if (!payload.checkId || !payload.title || !payload.summary || controlIds.length === 0 || !status) {
    const rejected = addAutomationEvent(
      store,
      payload.type,
      "rejected",
      defaultSourceName(payload.sourceName),
      "Check payload is missing required fields.",
      receivedAt
    );

    return {
      ok: false,
      status: 400,
      summary: "Check payload is missing required fields.",
      store: rejected
    };
  }

  const invalidControl = controlIds.find((controlId) => !ensureControlExists(store, controlId));

  if (invalidControl) {
    const rejected = addAutomationEvent(
      store,
      payload.type,
      "rejected",
      defaultSourceName(payload.sourceName),
      `Check payload referenced unknown control ${invalidControl}.`,
      receivedAt
    );

    return {
      ok: false,
      status: 400,
      summary: "Check payload referenced an unknown control.",
      store: rejected
    };
  }

  const run: CheckRun = {
    id: createId("run"),
    checkId: payload.checkId,
    title: payload.title,
    description: payload.description ?? payload.title,
    status,
    summary: payload.summary,
    severity: payload.severity ?? "medium",
    controlIds,
    ranAt: payload.ranAt ?? receivedAt,
    source: "automation",
    sourceName: defaultSourceName(payload.sourceName)
  };

  const updated = addAutomationEvent(
    applyCheckRunsToStore(store, [run]),
    payload.type,
    "accepted",
    defaultSourceName(payload.sourceName),
    `Check ${payload.checkId} recorded with status ${status}.`,
    receivedAt
  );

  return {
    ok: true,
    status: 202,
    summary: "Check event accepted.",
    store: updated
  };
}

function handleTaskCreate(store: Store, payload: TaskCreatePayload, receivedAt: string): IngestResult {
  if (!payload.title || !payload.owner || !payload.dueDate) {
    const rejected = addAutomationEvent(
      store,
      payload.type,
      "rejected",
      defaultSourceName(payload.sourceName),
      "Task payload is missing a title, owner, or dueDate.",
      receivedAt
    );

    return {
      ok: false,
      status: 400,
      summary: "Task payload is missing required fields.",
      store: rejected
    };
  }

  const updated = addAutomationEvent(
    {
      ...store,
      tasks: [
        {
          id: createId("task"),
          title: payload.title,
          description: payload.description ?? "",
          owner: payload.owner,
          dueDate: payload.dueDate,
          status: "open",
          priority: payload.priority === "high" || payload.priority === "low" ? payload.priority : "medium",
          sourceType: "automation",
          createdAt: receivedAt
        },
        ...store.tasks
      ]
    },
    payload.type,
    "accepted",
    defaultSourceName(payload.sourceName),
    `Task created for ${payload.owner}.`,
    receivedAt
  );

  return {
    ok: true,
    status: 202,
    summary: "Task event accepted.",
    store: updated
  };
}

export async function ingestAutomationPayload(store: Store, payload: AutomationPayload): Promise<IngestResult> {
  const receivedAt = new Date().toISOString();

  if (!store.automation.enabled) {
    const rejected = addAutomationEvent(
      store,
      payload.type,
      "rejected",
      defaultSourceName(payload.sourceName),
      "Automation webhook is disabled.",
      receivedAt
    );

    return {
      ok: false,
      status: 409,
      summary: "Automation integration is disabled.",
      store: rejected
    };
  }

  if (payload.type === "evidence.create") {
    return handleEvidenceCreate(store, payload, receivedAt);
  }

  if (payload.type === "check.report") {
    return handleCheckReport(store, payload, receivedAt);
  }

  return handleTaskCreate(store, payload, receivedAt);
}
