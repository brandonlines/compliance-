import { readFile } from "node:fs/promises";

import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = await getStore();
  const evidence = store.evidence.find((item) => item.id === id);

  if (!evidence?.filePath || !evidence.fileName) {
    return new Response("File not found", { status: 404 });
  }

  const file = await readFile(evidence.filePath);

  return new Response(file, {
    headers: {
      "Content-Type": evidence.mimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${evidence.originalName ?? evidence.fileName}"`
    }
  });
}
