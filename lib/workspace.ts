import { Prisma } from "@prisma/client";

import { buildSeedStore } from "@/data/seed";
import { DEV_USERS } from "@/data/dev-users";
import { prisma } from "@/lib/db";
import { normalizeStore } from "@/lib/store";
import { AppUser, Store } from "@/lib/types";

export const DEFAULT_WORKSPACE_ID = "workspace_default";

function toJsonStore(store: Store) {
  return store as unknown as Prisma.InputJsonValue;
}

function mapUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
}): AppUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AppUser["role"],
    workspaceId: user.workspaceId
  };
}

export function buildServerSeedStore(): Store {
  const seed = buildSeedStore();

  return normalizeStore({
    ...seed,
    organization: {
      ...seed.organization,
      auditWindow: "Active compliance workspace",
      workspaceMode: "Server-backed Postgres workspace"
    }
  });
}

export async function seedDatabase() {
  const store = buildServerSeedStore();

  await prisma.workspace.upsert({
    where: {
      id: DEFAULT_WORKSPACE_ID
    },
    update: {
      name: store.organization.name,
      store: toJsonStore(store)
    },
    create: {
      id: DEFAULT_WORKSPACE_ID,
      name: store.organization.name,
      store: toJsonStore(store)
    }
  });

  await Promise.all(
    DEV_USERS.map((user) =>
      prisma.user.upsert({
        where: {
          email: user.email
        },
        update: {
          id: user.id,
          name: user.name,
          role: user.role,
          workspaceId: DEFAULT_WORKSPACE_ID
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          workspaceId: DEFAULT_WORKSPACE_ID
        }
      })
    )
  );

  return {
    store,
    users: DEV_USERS
  };
}

export async function ensureSeededWorkspace() {
  const existing = await prisma.workspace.findUnique({
    where: {
      id: DEFAULT_WORKSPACE_ID
    }
  });

  if (!existing) {
    await seedDatabase();
    return;
  }

  const userCount = await prisma.user.count({
    where: {
      workspaceId: DEFAULT_WORKSPACE_ID
    }
  });

  if (userCount === 0) {
    await seedDatabase();
  }
}

export async function listDevUsers() {
  await ensureSeededWorkspace();

  const users = await prisma.user.findMany({
    where: {
      workspaceId: DEFAULT_WORKSPACE_ID
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return users.map(mapUser);
}

export async function getUserById(userId: string) {
  await ensureSeededWorkspace();

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  return user ? mapUser(user) : null;
}

export async function getWorkspaceStore(workspaceId = DEFAULT_WORKSPACE_ID) {
  await ensureSeededWorkspace();

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId
    }
  });

  return normalizeStore((workspace?.store ?? buildServerSeedStore()) as Store);
}

export async function saveWorkspaceStore(workspaceId: string, store: Store) {
  const normalized = normalizeStore(store);

  await prisma.workspace.upsert({
    where: {
      id: workspaceId
    },
    update: {
      name: normalized.organization.name,
      store: toJsonStore(normalized)
    },
    create: {
      id: workspaceId,
      name: normalized.organization.name,
      store: toJsonStore(normalized)
    }
  });

  return normalized;
}

export async function applyWorkspaceMutation(workspaceId: string, mutator: (store: Store) => Store) {
  const current = await getWorkspaceStore(workspaceId);
  const next = normalizeStore(mutator(current));

  await saveWorkspaceStore(workspaceId, next);

  return next;
}

export async function resetWorkspaceStore(workspaceId = DEFAULT_WORKSPACE_ID) {
  const store = buildServerSeedStore();
  await saveWorkspaceStore(workspaceId, store);
  return store;
}
