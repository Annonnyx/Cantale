import { requireSiteAdmin } from "@/server/session";
import { enqueueAdminAction, getAdminActionStatus, lookupPlayer } from "@/server/repo/admin";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "set_money",
  "add_money",
  "set_lives",
  "add_lives",
  "give_item",
  "ban",
  "unban",
  "msg",
  "discord_dm",
]);

export async function POST(request: Request) {
  const check = await requireSiteAdmin();
  if (!check.ok) return check.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON invalide." }, { status: 400 });
  }

  const obj = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const type = String(obj.type ?? "").toLowerCase();
  if (!ALLOWED.has(type)) {
    return Response.json({ error: "Type d'action inconnu." }, { status: 400 });
  }

  const target = String(obj.target ?? "").trim();
  const payload = obj.payload == null ? null : String(obj.payload);

  let targetUuid: string | null = null;
  let targetName: string | null = null;
  if (target) {
    const player = await lookupPlayer(target).catch(() => null);
    if (player) {
      targetUuid = player.uuid;
      targetName = player.username;
    } else {
      targetName = target;
    }
  }

  if (!targetUuid && !targetName && type !== "discord_dm") {
    // most actions need a target
  }
  if (!target && type !== "discord_dm") {
    return Response.json({ error: "Cible (pseudo ou UUID) requise." }, { status: 400 });
  }

  try {
    const id = await enqueueAdminAction({
      type,
      targetUuid,
      targetName,
      payload,
      actorDiscordId: check.user.discordUser!.id,
    });
    return Response.json({ ok: true, id, status: "pending" }, { status: 202 });
  } catch (error) {
    console.error("[api/admin/action]", error);
    return Response.json({ error: "File admin indisponible (JAR à déployer ?)." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const check = await requireSiteAdmin();
  if (!check.ok) return check.response;

  const idRaw = new URL(request.url).searchParams.get("id");
  const id = idRaw ? Number.parseInt(idRaw, 10) : NaN;
  if (!Number.isFinite(id)) {
    return Response.json({ error: "id requis." }, { status: 400 });
  }

  const row = await getAdminActionStatus(id).catch(() => null);
  if (!row) return Response.json({ error: "Action introuvable." }, { status: 404 });
  return Response.json(row, { headers: { "Cache-Control": "no-store" } });
}
