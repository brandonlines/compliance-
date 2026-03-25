import { Prisma } from "@prisma/client";

import { DEV_USERS } from "@/data/dev-users";
import { prisma } from "@/lib/db";
import {
  isLocalTestingMode,
  readLocalTestingState,
  seedLocalTestingState,
  writeLocalTestingState
} from "@/lib/local-testing";
import { normalizeStore } from "@/lib/store";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";
import { buildSeedStoreForEnvironment } from "@/lib/workspace-seed";
import { AppUser, Store } from "@/lib/types";

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
  return buildSeedStoreForEnvironment("server");
}

function assertSupportedLocalWorkspace(workspaceId: string) {
  if (workspaceId !== DEFAULT_WORKSPACE_ID) {
    throw new Error(`Local testing mode only supports the ${DEFAULT_WORKSPACE_ID} workspace.`);
  }
}

export async function seedDatabase() {
  if (isLocalTestingMode()) {
    return seedLocalTestingState();
  }

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
  if (isLocalTestingMode()) {
    await readLocalTestingState();
    return;
  }

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
  if (isLocalTestingMode()) {
    return (await readLocalTestingState()).users;
  }

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
  if (isLocalTestingMode()) {
    const state = await readLocalTestingState();
    return state.users.find((user) => user.id === userId) ?? null;
  }

  await ensureSeededWorkspace();

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  return user ? mapUser(user) : null;
}

export async function getWorkspaceStore(workspaceId = DEFAULT_WORKSPACE_ID) {
  if (isLocalTestingMode()) {
    assertSupportedLocalWorkspace(workspaceId);
    const state = await readLocalTestingState();
    return state.store;
  }

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

  if (isLocalTestingMode()) {
    assertSupportedLocalWorkspace(workspaceId);
    const state = await readLocalTestingState();
    await writeLocalTestingState({
      ...state,
      store: normalized
    });
    return normalized;
  }

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
  if (isLocalTestingMode()) {
    assertSupportedLocalWorkspace(workspaceId);
    const seeded = await seedLocalTestingState();
    return seeded.store;
  }

  const store = buildServerSeedStore();
  await saveWorkspaceStore(workspaceId, store);
  return store;
}
