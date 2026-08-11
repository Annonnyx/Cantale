import { requireSiteAdmin } from "@/server/session";
import { lookupPlayer } from "@/server/repo/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const check = await requireSiteAdmin();
  if (!check.ok) return check.response;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return Response.json({ error: "Paramètre q requis." }, { status: 400 });

  try {
    const player = await lookupPlayer(q);
    if (!player) return Response.json({ error: "Joueur introuvable." }, { status: 404 });
    return Response.json({ player }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/admin/player]", error);
    return Response.json({ error: "Recherche impossible." }, { status: 503 });
  }
}
