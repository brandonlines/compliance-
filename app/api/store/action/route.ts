import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { canManageWorkspace } from "@/lib/security";
import { applyStoreAction, parseStoreAction, validateStoreAction } from "@/lib/store-actions";
import { getWorkspaceStore, resetWorkspaceStore, saveWorkspaceStore } from "@/lib/workspace";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  if (!canManageWorkspace(currentUser)) {
    return NextResponse.json(
      {
        error: "Forbidden"
      },
      {
        status: 403
      }
    );
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Request body must be valid JSON."
      },
      {
        status: 400
      }
    );
  }

  const action = parseStoreAction(input);

  if (!action) {
    return NextResponse.json(
      {
        error: "Invalid store action."
      },
      {
        status: 400
      }
    );
  }

  const currentStore = await getWorkspaceStore(currentUser.workspaceId);
  const validationError = validateStoreAction(currentStore, action);

  if (validationError) {
    return NextResponse.json(
      {
        error: validationError
      },
      {
        status: 400
      }
    );
  }

  if (action.type === "resetDemo") {
    const store = await resetWorkspaceStore(currentUser.workspaceId);

    return NextResponse.json({
      store
    });
  }

  const result = applyStoreAction(currentStore, action);
  const savedStore = await saveWorkspaceStore(currentUser.workspaceId, result.store);

  return NextResponse.json({
    ...result,
    store: savedStore
  });
}
