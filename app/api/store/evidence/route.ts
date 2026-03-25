import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { canManageWorkspace, MAX_EVIDENCE_UPLOAD_BYTES } from "@/lib/security";
import { appendEvidence, validateEvidenceInput } from "@/lib/store-actions";
import { getWorkspaceStore, saveWorkspaceStore } from "@/lib/workspace";

function toDataUrl(file: File, bytes: ArrayBuffer) {
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type || "application/octet-stream";
  return `data:${mimeType};base64,${base64}`;
}

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

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const owner = String(formData.get("owner") ?? "").trim();
  const controlId = String(formData.get("controlId") ?? "").trim();
  const currentStore = await getWorkspaceStore(currentUser.workspaceId);

  const file = formData.get("file");
  let fileName: string | undefined;
  let originalName: string | undefined;
  let mimeType: string | undefined;
  let fileDataUrl: string | undefined;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_EVIDENCE_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: "Evidence uploads are limited to 5 MB."
        },
        {
          status: 413
        }
      );
    }

    const bytes = await file.arrayBuffer();
    fileName = file.name;
    originalName = file.name;
    mimeType = file.type || "application/octet-stream";
    fileDataUrl = toDataUrl(file, bytes);
  }

  const input = {
    title,
    description: String(formData.get("description") ?? "").trim(),
    owner,
    controlId,
    policyId: String(formData.get("policyId") ?? "").trim() || undefined,
    fileName,
    originalName,
    mimeType,
    fileDataUrl
  };
  const validationError = validateEvidenceInput(currentStore, input);

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

  const nextStore = appendEvidence(currentStore, input);
  const store = await saveWorkspaceStore(currentUser.workspaceId, nextStore);

  return NextResponse.json({
    store
  });
}
