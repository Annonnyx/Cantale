import { getServerStatus } from "@/server/repo/server-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getServerStatus();
  if (!status) {
    return Response.json({ online: null }, { status: 503 });
  }
  return Response.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
