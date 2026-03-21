"use client";

import { startTransition, createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from "react";

import { buildSeedStore } from "@/data/seed";
import { ingestAutomationPayload, AutomationPayload } from "@/lib/automation";
import { fileToDataUrl } from "@/lib/browser";
import { runAllChecks } from "@/lib/compliance";
import {
  createAutomationSecret,
  createId,
  normalizeStore,
  readStoredStore,
  writeStoredStore
} from "@/lib/store";
import { Integration, Severity, Store, TaskStatus } from "@/lib/types";

type UploadEvidenceInput = {
  title: string;
  description: string;
  owner: string;
  controlId: string;
  policyId?: string;
  file?: File | null;
};

type CreateTaskInput = {
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  priority: Severity;
};

type SaveIntegrationInput = {
  integrationId: string;
  owner: string;
  connected: boolean;
  settings: Record<string, boolean | string>;
};

type AppContextValue = {
  store: Store;
  runChecks: () => void;
  uploadEvidence: (input: UploadEvidenceInput) => Promise<void>;
  reviewPolicy: (policyId: string, reviewDate: string) => void;
  saveIntegration: (input: SaveIntegrationInput) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  createTask: (input: CreateTaskInput) => void;
  updateAutomationEnabled: (enabled: boolean) => void;
  rotateAutomationSecret: () => void;
  applyAutomationPayload: (payload: AutomationPayload) => { ok: boolean; summary: string };
  resetDemo: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function formatLocalDate(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0")
  ].join("-");
}

function updateStoreState(setStore: Dispatch<SetStateAction<Store>>, updater: (store: Store) => Store) {
  startTransition(() => {
    setStore((current) => normalizeStore(updater(current)));
  });
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(buildSeedStore());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStore(readStoredStore());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    writeStoredStore(store);
  }, [loaded, store]);

  const value = useMemo<AppContextValue>(
    () => ({
      store,
      runChecks() {
        updateStoreState(setStore, (current) => runAllChecks(current));
      },
      async uploadEvidence(input) {
        let fileDataUrl: string | undefined;
        let fileName: string | undefined;
        let originalName: string | undefined;
        let mimeType: string | undefined;
        let kind: "upload" | "snapshot" = "snapshot";

        if (input.file && input.file.size > 0) {
          fileDataUrl = await fileToDataUrl(input.file);
          fileName = input.file.name;
          originalName = input.file.name;
          mimeType = input.file.type || "application/octet-stream";
          kind = "upload";
        }

        updateStoreState(setStore, (current) => ({
          ...current,
          evidence: [
            {
              id: createId("evidence"),
              title: input.title,
              description: input.description,
              owner: input.owner,
              kind,
              source: "manual",
              controlId: input.controlId,
              policyId: input.policyId || undefined,
              uploadedAt: new Date().toISOString(),
              fileName,
              originalName,
              mimeType,
              fileDataUrl
            },
            ...current.evidence
          ]
        }));
      },
      reviewPolicy(policyId, reviewDate) {
        const nextReview = new Date(`${reviewDate}T12:00:00`);
        nextReview.setFullYear(nextReview.getFullYear() + 1);

        updateStoreState(setStore, (current) => ({
          ...current,
          policies: current.policies.map((policy) =>
            policy.id === policyId
              ? {
                  ...policy,
                  lastReviewed: reviewDate,
                  nextReviewDue: formatLocalDate(nextReview)
                }
              : policy
          )
        }));
      },
      saveIntegration(input) {
        updateStoreState(setStore, (current) => ({
          ...current,
          integrations: current.integrations.map((integration) =>
            integration.id === input.integrationId ? updateIntegrationSettings(integration, input) : integration
          )
        }));
      },
      updateTaskStatus(taskId, status) {
        updateStoreState(setStore, (current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status,
                  completedAt: status === "done" ? new Date().toISOString() : undefined
                }
              : task
          )
        }));
      },
      createTask(input) {
        updateStoreState(setStore, (current) => ({
          ...current,
          tasks: [
            {
              id: createId("task"),
              title: input.title,
              description: input.description,
              owner: input.owner,
              dueDate: input.dueDate,
              status: "open",
              priority: input.priority,
              sourceType: "manual",
              createdAt: new Date().toISOString()
            },
            ...current.tasks
          ]
        }));
      },
      updateAutomationEnabled(enabled) {
        updateStoreState(setStore, (current) => ({
          ...current,
          automation: {
            ...current.automation,
            enabled
          }
        }));
      },
      rotateAutomationSecret() {
        updateStoreState(setStore, (current) => ({
          ...current,
          automation: {
            ...current.automation,
            secret: createAutomationSecret()
          }
        }));
      },
      applyAutomationPayload(payload) {
        const ingested = ingestAutomationPayload(store, payload);
        startTransition(() => {
          setStore(normalizeStore(ingested.store));
        });
        return {
          ok: ingested.ok,
          summary: ingested.summary
        };
      },
      resetDemo() {
        startTransition(() => {
          setStore(buildSeedStore());
        });
      }
    }),
    [store]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error("useAppStore must be used within AppProvider.");
  }

  return value;
}
