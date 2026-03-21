import { buildAuditorPacket } from "@/lib/compliance";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getStore();
  const packet = buildAuditorPacket(store);

  return Response.json(packet, {
    headers: {
      "Content-Disposition": 'attachment; filename="auditor-packet.json"'
    }
  });
}
