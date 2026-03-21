"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { runAllChecks } from "@/lib/compliance";
import { createAutomationSecret, createId, updateStore, uploadsDirectory } from "@/lib/store";
import { Integration, TaskStatus } from "@/lib/types";

function refreshApp() {
  const paths = [
    "/",
    "/controls",
    "/evidence",
    "/policies",
    "/tasks",
    "/integrations",
    "/checks",
    "/auditor",
    "/automation"
  ];

  for (const route of paths) {
    revalidatePath(route);
  }

  revalidatePath("/controls/[id]", "page");
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function formatLocalDate(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0")
  ].join("-");
}

export async function runChecksAction() {
  await updateStore(async (store) => runAllChecks(store));
  refreshApp();
}

export async function uploadEvidenceAction(formData: FormData) {
  const title = textValue(formData, "title");
  const description = textValue(formData, "description");
  const owner = textValue(formData, "owner");
  const controlId = textValue(formData, "controlId");
  const policyId = textValue(formData, "policyId");
  const file = formData.get("file");

  if (!title || !owner || !controlId) {
    return;
  }

  let filePath: string | undefined;
  let fileName: string | undefined;
  let originalName: string | undefined;
  let mimeType: string | undefined;
  let kind: "upload" | "snapshot" = "snapshot";

  if (file instanceof File && file.size > 0) {
    await mkdir(uploadsDirectory, { recursive: true });
    fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
    filePath = path.join(uploadsDirectory, fileName);
    originalName = file.name;
    mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    kind = "upload";
  }

  await updateStore(async (store) => ({
    ...store,
    evidence: [
      {
        id: createId("evidence"),
        title,
        description,
        owner,
        kind,
        source: "manual",
        controlId,
        policyId: policyId || undefined,
        uploadedAt: new Date().toISOString(),
        filePath,
        fileName,
        originalName,
        mimeType
      },
      ...store.evidence
    ]
  }));

  refreshApp();
}

export async function reviewPolicyAction(formData: FormData) {
  const policyId = textValue(formData, "policyId");
  const reviewDate = textValue(formData, "reviewDate") || new Date().toISOString().slice(0, 10);
  const nextReview = new Date(`${reviewDate}T12:00:00`);
  nextReview.setFullYear(nextReview.getFullYear() + 1);

  await updateStore(async (store) => ({
    ...store,
    policies: store.policies.map((policy) =>
      policy.id === policyId
        ? {
            ...policy,
            lastReviewed: reviewDate,
            nextReviewDue: formatLocalDate(nextReview)
          }
        : policy
    )
  }));

  refreshApp();
}

function updateIntegrationSettings(integration: Integration, formData: FormData) {
  if (integration.id === "integration_github") {
    return {
      ...integration,
      connected: checkboxValue(formData, "connected"),
      owner: textValue(formData, "owner") || integration.owner,
      lastSync: new Date().toISOString(),
      settings: {
        ...integration.settings,
        branchProtectionEnabled: checkboxValue(formData, "branchProtectionEnabled"),
        requiresApprovals: checkboxValue(formData, "requiresApprovals"),
        repositoryCount: textValue(formData, "repositoryCount") || "0"
      }
    };
  }

  if (integration.id === "integration_aws") {
    return {
      ...integration,
      connected: checkboxValue(formData, "connected"),
      owner: textValue(formData, "owner") || integration.owner,
      lastSync: new Date().toISOString(),
      settings: {
        ...integration.settings,
        cloudTrailEnabled: checkboxValue(formData, "cloudTrailEnabled"),
        awsConfigEnabled: checkboxValue(formData, "awsConfigEnabled"),
        productionAccounts: textValue(formData, "productionAccounts") || "0"
      }
    };
  }

  return {
    ...integration,
    connected: checkboxValue(formData, "connected"),
    owner: textValue(formData, "owner") || integration.owner,
    lastSync: new Date().toISOString(),
    settings: {
      ...integration.settings,
      mfaRequired: checkboxValue(formData, "mfaRequired"),
      ssoEnabled: checkboxValue(formData, "ssoEnabled"),
      userCount: textValue(formData, "userCount") || "0"
    }
  };
}

export async function saveIntegrationAction(formData: FormData) {
  const integrationId = textValue(formData, "integrationId");

  await updateStore(async (store) => ({
    ...store,
    integrations: store.integrations.map((integration) =>
      integration.id === integrationId ? updateIntegrationSettings(integration, formData) : integration
    )
  }));

  refreshApp();
}

export async function updateTaskStatusAction(formData: FormData) {
  const taskId = textValue(formData, "taskId");
  const status = textValue(formData, "status") as TaskStatus;

  await updateStore(async (store) => ({
    ...store,
    tasks: store.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
            completedAt: status === "done" ? new Date().toISOString() : undefined
          }
        : task
    )
  }));

  refreshApp();
}

export async function createTaskAction(formData: FormData) {
  const title = textValue(formData, "title");
  const description = textValue(formData, "description");
  const owner = textValue(formData, "owner");
  const dueDate = textValue(formData, "dueDate");
  const priority = textValue(formData, "priority");

  if (!title || !owner || !dueDate || !priority) {
    return;
  }

  await updateStore(async (store) => ({
    ...store,
    tasks: [
      {
        id: createId("task"),
        title,
        description,
        owner,
        dueDate,
        status: "open",
        priority: priority === "high" || priority === "medium" ? priority : "low",
        sourceType: "manual",
        createdAt: new Date().toISOString()
      },
      ...store.tasks
    ]
  }));

  refreshApp();
}

export async function updateAutomationSettingsAction(formData: FormData) {
  await updateStore(async (store) => ({
    ...store,
    automation: {
      ...store.automation,
      enabled: checkboxValue(formData, "enabled")
    }
  }));

  refreshApp();
}

export async function rotateAutomationSecretAction() {
  await updateStore(async (store) => ({
    ...store,
    automation: {
      ...store.automation,
      secret: createAutomationSecret()
    }
  }));

  refreshApp();
}
