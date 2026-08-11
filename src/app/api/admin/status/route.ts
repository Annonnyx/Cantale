import { requireSiteAdmin } from "@/server/session";
import { getOnlinePlayersFromStatus, listDiscordTickets } from "@/server/repo/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const check = await requireSiteAdmin();
  if (!check.ok) return check.response;

  try {
    const [status, tickets] = await Promise.all([
      getOnlinePlayersFromStatus(),
      listDiscordTickets().catch(() => []),
    ]);
    return Response.json(
      { ...status, tickets },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/status]", error);
    return Response.json({ error: "Statut admin indisponible." }, { status: 503 });
  }
}
