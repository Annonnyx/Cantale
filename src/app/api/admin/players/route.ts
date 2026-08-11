import { requireSiteAdmin } from "@/server/session";
import { getOnlinePlayersFromStatus, listPlayersForAdmin } from "@/server/repo/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const check = await requireSiteAdmin();
  if (!check.ok) return check.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);

  try {
    // Statut online = optionnel (badge / compteurs). La liste players ne doit jamais dépendre de server_status.
    const status = await getOnlinePlayersFromStatus().catch((error) => {
      console.error("[api/admin/players] status", error);
      return { online: 0, max: null as number | null, updatedAt: null as string | null, players: [] as { uuid: string; name: string }[] };
    });
    const onlineUuids = status.players.map((p) => p.uuid);
    const onlineSet = new Set(onlineUuids.map((u) => u.toLowerCase()));

    const listed = await listPlayersForAdmin({
      q,
      page,
      limit,
      onlineUuids,
    });

    return Response.json(
      {
        players: listed.players.map((p) => ({
          ...p,
          online: onlineSet.has(p.uuid.toLowerCase()),
        })),
        total: listed.total,
        page: listed.page,
        limit: listed.limit,
        online: status.online,
        max: status.max,
        updatedAt: status.updatedAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/players]", error);
    return Response.json({ error: "Liste joueurs indisponible." }, { status: 503 });
  }
}
