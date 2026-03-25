import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { DEV_USERS } from "@/data/dev-users";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";
import { buildSeedStoreForEnvironment } from "@/lib/workspace-seed";
import { AppUser, Store } from "@/lib/types";

type LocalTestingState = {
  store: Store;
  users: AppUser[];
};

export function isLocalTestingMode() {
  return process.env.TRUST_CONSOLE_LOCAL_MODE === "true";
}

export function getLocalTestingStorePath() {
  return process.env.TRUST_CONSOLE_LOCAL_STORE_PATH ?? path.join(process.cwd(), "data", "local-testing-store.json");
}

function buildSeedState(): LocalTestingState {
  return {
    store: buildSeedStoreForEnvironment("local"),
    users: DEV_USERS.map((user) => ({
      ...user,
      workspaceId: DEFAULT_WORKSPACE_ID
    }))
  };
}

function normalizeState(state: Partial<LocalTestingState>): LocalTestingState {
  const seeded = buildSeedState();

  return {
    store: state.store ?? seeded.store,
    users: (state.users ?? seeded.users).map((user) => ({
      ...user,
      workspaceId: DEFAULT_WORKSPACE_ID
    }))
  };
}

async function writeState(state: LocalTestingState) {
  const storePath = getLocalTestingStorePath();
  const tempPath = `${storePath}.tmp`;

  await mkdir(path.dirname(storePath), {
    recursive: true
  });
  await writeFile(tempPath, JSON.stringify(normalizeState(state), null, 2), "utf8");
  await rename(tempPath, storePath);
}

export async function readLocalTestingState() {
  try {
    const raw = await readFile(getLocalTestingStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalTestingState>;
    return normalizeState(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code && (error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const seeded = buildSeedState();
    await writeState(seeded);
    return seeded;
  }
}

export async function writeLocalTestingState(state: LocalTestingState) {
  const normalized = normalizeState(state);
  await writeState(normalized);
  return normalized;
}

export async function seedLocalTestingState() {
  const seeded = buildSeedState();
  await writeState(seeded);
  return seeded;
}
