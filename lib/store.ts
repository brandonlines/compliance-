import { buildSeedStore } from "@/data/seed";
import { Store } from "@/lib/types";

const STORAGE_KEY = "trust-console-store-v1";

function fallbackId() {
  return Math.random().toString(36).slice(2, 10);
}

function randomValue() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replaceAll("-", "");
  }

  return `${fallbackId()}${fallbackId()}`;
}

export function createId(prefix: string) {
  return `${prefix}_${randomValue().slice(0, 8)}`;
}

export function createAutomationSecret() {
  return `trust_${randomValue()}`;
}

export function normalizeStore(input: Store | null | undefined) {
  const defaults = buildSeedStore();

  if (!input) {
    return defaults;
  }

  return {
    ...defaults,
    ...input,
    organization: {
      ...defaults.organization,
      ...input.organization
    },
    controls: input.controls ?? defaults.controls,
    policies: input.policies ?? defaults.policies,
    evidence: (input.evidence ?? defaults.evidence).map((item) => ({
      ...item,
      source: item.source ?? "manual"
    })),
    tasks: (input.tasks ?? defaults.tasks).map((task) => ({
      ...task,
      sourceType: task.sourceType ?? "manual"
    })),
    integrations: input.integrations ?? defaults.integrations,
    checkRuns: (input.checkRuns ?? defaults.checkRuns).map((run) => ({
      ...run,
      source: run.source ?? "internal"
    })),
    automation: {
      ...defaults.automation,
      ...input.automation,
      events: input.automation?.events ?? defaults.automation.events
    }
  };
}

export function readStoredStore() {
  if (typeof window === "undefined") {
    return buildSeedStore();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return buildSeedStore();
    }

    return normalizeStore(JSON.parse(raw) as Store);
  } catch {
    return buildSeedStore();
  }
}

export function writeStoredStore(store: Store) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
