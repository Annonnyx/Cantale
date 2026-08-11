import { requireSiteAdmin } from "@/server/session";
import { getAdminSnapshot } from "@/server/repo/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const check = await requireSiteAdmin();
  if (!check.ok) return check.response;

  const idRaw = new URL(request.url).searchParams.get("id");
  const id = idRaw ? Number.parseInt(idRaw, 10) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: "id requis." }, { status: 400 });
  }

  const row = await getAdminSnapshot(id).catch(() => null);
  if (!row) return Response.json({ error: "Snapshot introuvable." }, { status: 404 });
  return Response.json(row, { headers: { "Cache-Control": "no-store" } });
}
