import { prisma } from "@/lib/db";
import { applyStoreAction } from "@/lib/store-actions";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";
import {
  getWorkspaceStore,
  listDevUsers,
  resetWorkspaceStore,
  saveWorkspaceStore,
  seedDatabase
} from "@/lib/workspace";

describe("workspace persistence", () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }

    await seedDatabase();
  });

  beforeEach(async () => {
    await resetWorkspaceStore();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("seedDatabase provisions the seeded dev users", async () => {
    const users = await listDevUsers();

    expect(users).toHaveLength(3);
    expect(users.map((user) => user.role).sort()).toEqual(["admin", "auditor", "viewer"]);
  });

  test("store mutations persist through Postgres", async () => {
    const seeded = await getWorkspaceStore(DEFAULT_WORKSPACE_ID);
    const result = applyStoreAction(seeded, {
      type: "runChecks"
    });

    await saveWorkspaceStore(DEFAULT_WORKSPACE_ID, result.store);

    const reloaded = await getWorkspaceStore(DEFAULT_WORKSPACE_ID);

    expect(reloaded.checkRuns).toHaveLength(result.store.checkRuns.length);
    expect(reloaded.tasks.some((task) => task.sourceType === "check")).toBe(true);
    expect(reloaded.organization.workspaceMode).toContain("Postgres");
  });
});
