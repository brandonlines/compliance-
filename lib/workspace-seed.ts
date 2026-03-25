import { buildSeedStore } from "@/data/seed";
import { normalizeStore } from "@/lib/store";
import { Store } from "@/lib/types";

export type WorkspaceEnvironment = "local" | "server";

const WORKSPACE_PROFILES: Record<
  WorkspaceEnvironment,
  {
    auditWindow: string;
    workspaceMode: string;
  }
> = {
  local: {
    auditWindow: "Local testing workspace",
    workspaceMode: "File-backed local testing mode"
  },
  server: {
    auditWindow: "Active compliance workspace",
    workspaceMode: "Server-backed Postgres workspace"
  }
};

export function buildSeedStoreForEnvironment(environment: WorkspaceEnvironment): Store {
  const seed = buildSeedStore();
  const profile = WORKSPACE_PROFILES[environment];

  return normalizeStore({
    ...seed,
    organization: {
      ...seed.organization,
      auditWindow: profile.auditWindow,
      workspaceMode: profile.workspaceMode
    }
  });
}
