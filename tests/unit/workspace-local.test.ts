import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { applyStoreAction } from "@/lib/store-actions";
import { getLocalTestingStorePath, isLocalTestingMode } from "@/lib/local-testing";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";
import { getWorkspaceStore, resetWorkspaceStore, saveWorkspaceStore, seedDatabase } from "@/lib/workspace";

describe("local testing workspace", () => {
  const originalLocalMode = process.env.TRUST_CONSOLE_LOCAL_MODE;
  const originalStorePath = process.env.TRUST_CONSOLE_LOCAL_STORE_PATH;
  let tempDir: string;
  let storePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "trust-console-local-"));
    storePath = path.join(tempDir, "local-testing-store.json");
    process.env.TRUST_CONSOLE_LOCAL_MODE = "true";
    process.env.TRUST_CONSOLE_LOCAL_STORE_PATH = storePath;
    await resetWorkspaceStore();
  });

  afterEach(async () => {
    if (originalLocalMode === undefined) {
      delete process.env.TRUST_CONSOLE_LOCAL_MODE;
    } else {
      process.env.TRUST_CONSOLE_LOCAL_MODE = originalLocalMode;
    }

    if (originalStorePath === undefined) {
      delete process.env.TRUST_CONSOLE_LOCAL_STORE_PATH;
    } else {
      process.env.TRUST_CONSOLE_LOCAL_STORE_PATH = originalStorePath;
    }

    await rm(tempDir, {
      force: true,
      recursive: true
    });
  });

  test("seedDatabase provisions a file-backed workspace with the seeded dev users", async () => {
    const seeded = await seedDatabase();

    expect(isLocalTestingMode()).toBe(true);
    expect(getLocalTestingStorePath()).toBe(storePath);
    expect(seeded.store.organization.workspaceMode).toContain("File-backed");
    expect(seeded.users).toHaveLength(3);
  });

  test("store mutations persist through the local testing file", async () => {
    const seeded = await getWorkspaceStore(DEFAULT_WORKSPACE_ID);
    const result = applyStoreAction(seeded, {
      type: "runChecks"
    });

    await saveWorkspaceStore(DEFAULT_WORKSPACE_ID, result.store);

    const reloaded = await getWorkspaceStore(DEFAULT_WORKSPACE_ID);
    const persisted = JSON.parse(await readFile(storePath, "utf8")) as {
      store: { checkRuns: unknown[] };
    };

    expect(reloaded.checkRuns).toHaveLength(result.store.checkRuns.length);
    expect(reloaded.organization.workspaceMode).toContain("File-backed");
    expect(persisted.store.checkRuns).toHaveLength(result.store.checkRuns.length);
  });

  test("non-default workspace ids are rejected in local testing mode", async () => {
    await expect(getWorkspaceStore("workspace_secondary")).rejects.toThrow("Local testing mode only supports");

    const seeded = await getWorkspaceStore(DEFAULT_WORKSPACE_ID);

    await expect(saveWorkspaceStore("workspace_secondary", seeded)).rejects.toThrow(
      "Local testing mode only supports"
    );
  });
});
