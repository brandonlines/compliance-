import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { buildSeedStore } from "@/data/seed";
import { Store } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "store.json");
const uploadsDirectory = path.join(dataDirectory, "uploads");

async function ensureStore() {
  await mkdir(uploadsDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    const seed = buildSeedStore();
    await writeFile(storePath, JSON.stringify(seed, null, 2), "utf8");
  }
}

function normalizeStore(input: Store): Store {
  const defaults = buildSeedStore();

  return {
    ...input,
    evidence: input.evidence.map((item) => ({
      ...item,
      source: item.source ?? "manual"
    })),
    tasks: input.tasks.map((task) => ({
      ...task,
      sourceType: task.sourceType ?? "manual"
    })),
    checkRuns: (input.checkRuns ?? []).map((run) => ({
      ...run,
      source: run.source ?? "internal"
    })),
    automation: input.automation ?? defaults.automation
  };
}

export async function getStore() {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  const parsed = JSON.parse(raw) as Store;

  return normalizeStore(parsed);
}

export async function saveStore(store: Store) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function updateStore(mutator: (store: Store) => Store | Promise<Store>) {
  const current = await getStore();
  const updated = await mutator(current);
  await saveStore(updated);

  return updated;
}

export function createId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

export function createAutomationSecret() {
  return `mto_${randomUUID().replaceAll("-", "")}`;
}

export { storePath, uploadsDirectory };
