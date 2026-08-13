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
  "inspect_player",
  "clear_container",
  "remove_slot",
  "clear_shulker",
  "give_effect",
  "clear_effect",
  "set_pasdic",
]);

const NO_TARGET = new Set(["discord_dm", "set_pasdic"]);
const MAX_PASDIC_CHUNKS = 250;

type PasdicChunk = { w: string; x: number; z: number };

function parsePasdicPayload(raw: string | null): { ok: true; payload: string } | { ok: false; error: string } {
  if (!raw) return { ok: false, error: "Liste de claims requise." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: "JSON claims invalide." };
  }
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { chunks?: unknown }).chunks)
      ? (parsed as { chunks: unknown[] }).chunks
      : null;
  if (!list) return { ok: false, error: "JSON { chunks: [...] } requis." };
  if (list.length === 0) return { ok: false, error: "Aucun claim sélectionné." };
  if (list.length > MAX_PASDIC_CHUNKS) {
    return { ok: false, error: `Trop de claims (max ${MAX_PASDIC_CHUNKS}).` };
  }
  const seen = new Set<string>();
  const chunks: PasdicChunk[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const world = String(row.w ?? row.world ?? "").trim();
    const x = Number(row.x);
    const z = Number(row.z);
    if (!world || !Number.isFinite(x) || !Number.isFinite(z)) continue;
    const cx = Math.trunc(x);
    const cz = Math.trunc(z);
    const key = `${world}:${cx}:${cz}`;
    if (seen.has(key)) continue;
    seen.add(key);
    chunks.push({ w: world, x: cx, z: cz });
  }
  if (chunks.length === 0) return { ok: false, error: "Aucun claim valide." };
  return { ok: true, payload: JSON.stringify({ chunks }) };
}

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
  let payload = obj.payload == null ? null : String(obj.payload);

  if (type === "set_pasdic") {
    const parsed = parsePasdicPayload(payload);
    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    payload = parsed.payload;
  }

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

  if (!target && !NO_TARGET.has(type)) {
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
