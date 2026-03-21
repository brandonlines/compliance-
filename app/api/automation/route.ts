import { ingestAutomationPayload, type AutomationPayload } from "@/lib/automation";
import { getStore, updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function extractAutomationKey(request: Request) {
  const headerKey = request.headers.get("x-trustops-key");

  if (headerKey) {
    return headerKey.trim();
  }

  const authorization = request.headers.get("authorization");

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}

export async function POST(request: Request) {
  const store = await getStore();
  const providedKey = extractAutomationKey(request);

  if (!providedKey || providedKey !== store.automation.secret) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized"
      },
      { status: 401 }
    );
  }

  let payload: AutomationPayload;

  try {
    payload = (await request.json()) as AutomationPayload;
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Invalid JSON"
      },
      { status: 400 }
    );
  }

  if (!["evidence.create", "check.report", "task.create"].includes(String((payload as { type?: string }).type))) {
    return Response.json(
      {
        ok: false,
        error: "Unsupported automation event type"
      },
      { status: 400 }
    );
  }

  let resultSummary = "Accepted";
  let resultStatus = 202;
  let resultOk = true;

  await updateStore(async (current) => {
    const result = await ingestAutomationPayload(current, payload);
    resultSummary = result.summary;
    resultStatus = result.status;
    resultOk = result.ok;

    return result.store;
  });

  return Response.json(
    {
      ok: resultOk,
      summary: resultSummary
    },
    { status: resultStatus }
  );
}
