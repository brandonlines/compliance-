"use client";

import { startTransition, createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { AutomationPayload } from "@/lib/automation";
import { normalizeStore } from "@/lib/store";
import {
  CreateTaskInput,
  SaveIntegrationInput,
  StoreAction,
  UploadEvidenceInput
} from "@/lib/store-actions";
import { AppUser, Store, TaskStatus } from "@/lib/types";

type UploadEvidenceInputWithFile = UploadEvidenceInput & {
  file?: File | null;
};

type StoreMutationResponse = {
  store: Store;
  ok?: boolean;
  summary?: string;
};

type AppContextValue = {
  currentUser: AppUser;
  store: Store;
  runChecks: () => Promise<void>;
  uploadEvidence: (input: UploadEvidenceInputWithFile) => Promise<void>;
  reviewPolicy: (policyId: string, reviewDate: string) => Promise<void>;
  saveIntegration: (input: SaveIntegrationInput) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateAutomationEnabled: (enabled: boolean) => Promise<void>;
  rotateAutomationSecret: () => Promise<void>;
  applyAutomationPayload: (payload: AutomationPayload) => Promise<{ ok: boolean; summary: string }>;
  resetDemo: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

async function submitStoreAction(action: StoreAction) {
  const response = await fetch("/api/store/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(action)
  });

  if (!response.ok) {
    throw new Error("Failed to update workspace state.");
  }

  return (await response.json()) as StoreMutationResponse;
}

async function submitEvidence(input: UploadEvidenceInputWithFile) {
  const data = new FormData();
  data.set("title", input.title);
  data.set("description", input.description);
  data.set("owner", input.owner);
  data.set("controlId", input.controlId);

  if (input.policyId) {
    data.set("policyId", input.policyId);
  }

  if (input.file && input.file.size > 0) {
    data.set("file", input.file);
  }

  const response = await fetch("/api/store/evidence", {
    method: "POST",
    body: data
  });

  if (!response.ok) {
    throw new Error("Failed to upload evidence.");
  }

  return (await response.json()) as StoreMutationResponse;
}

export function AppProvider({
  children,
  currentUser,
  initialStore
}: {
  children: ReactNode;
  currentUser: AppUser;
  initialStore: Store;
}) {
  const [store, setStore] = useState<Store>(initialStore);

  useEffect(() => {
    setStore(initialStore);
  }, [initialStore]);

  const value = useMemo<AppContextValue>(
    () => ({
      currentUser,
      store,
      async runChecks() {
        const result = await submitStoreAction({
          type: "runChecks"
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      },
      async uploadEvidence(input) {
        const result = await submitEvidence(input);

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      },
      async reviewPolicy(policyId, reviewDate) {
        const result = await submitStoreAction({
          type: "reviewPolicy",
          policyId,
          reviewDate
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      },
      async saveIntegration(input) {
        const result = await submitStoreAction({
          type: "saveIntegration",
          input
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      },
      async updateTaskStatus(taskId, status) {
        const result = await submitStoreAction({
          type: "updateTaskStatus",
          taskId,
          status
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      },
      async createTask(input) {
        const result = await submitStoreAction({
          type: "createTask",
          input
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      },
      async updateAutomationEnabled(enabled) {
        const result = await submitStoreAction({
          type: "updateAutomationEnabled",
          enabled
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      },
      async rotateAutomationSecret() {
        const result = await submitStoreAction({
          type: "rotateAutomationSecret"
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      },
      async applyAutomationPayload(payload) {
        const result = await submitStoreAction({
          type: "applyAutomationPayload",
          payload
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });

        return {
          ok: result.ok ?? true,
          summary: result.summary ?? "Automation event accepted."
        };
      },
      async resetDemo() {
        const result = await submitStoreAction({
          type: "resetDemo"
        });

        startTransition(() => {
          setStore(normalizeStore(result.store));
        });
      }
    }),
    [currentUser, store]
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
