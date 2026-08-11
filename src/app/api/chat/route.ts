import { getSessionUser, requireLinked } from "@/server/session";
import {
  CHAT_MESSAGE_MAX_LENGTH,
  clampChatLimit,
  enqueueChatMessage,
  getFactionChatAfter,
  getFactionName,
  getGlobalChatAfter,
  getPlayerFactionId,
  getRecentFactionChat,
  getRecentGlobalChat,
} from "@/server/repo/chat";

export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 3_000;
const recentPosts = new Map<string, number>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const last = recentPosts.get(key) ?? 0;
  if (now - last < RATE_WINDOW_MS) return true;
  recentPosts.set(key, now);
  if (recentPosts.size > 5_000) {
    for (const [k, t] of recentPosts) {
      if (now - t > RATE_WINDOW_MS * 4) recentPosts.delete(k);
    }
  }
  return false;
}

function sanitizeMessage(raw: string): string | null {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (trimmed.length > CHAT_MESSAGE_MAX_LENGTH) return null;
  const lower = trimmed.toLowerCase();
  if (lower.includes("@everyone") || lower.includes("@here")) return null;
  if (/§[0-9a-fk-or]/i.test(trimmed)) return null;
  return trimmed;
}

/**
 * GET /api/chat?scope=global|faction&after=&limit=
 * Faction : réservé aux membres (compte lié + faction_members).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const scope = params.get("scope") === "faction" ? "faction" : "global";
  const afterRaw = params.get("after");
  const limit = clampChatLimit(params.get("limit") ?? undefined);
  const afterId = afterRaw ? Number.parseInt(afterRaw, 10) : 0;

  try {
    const session = await getSessionUser();
    let factionId: number | null = null;
    let factionName: string | null = null;

    if (session.mc) {
      factionId = await getPlayerFactionId(session.mc.uuid).catch(() => null);
      if (factionId) factionName = await getFactionName(factionId).catch(() => null);
    }

    if (scope === "faction") {
      if (!session.mc || !factionId) {
        return Response.json({ error: "Chat faction réservé aux membres." }, { status: 403 });
      }
      const messages =
        Number.isFinite(afterId) && afterId > 0
          ? await getFactionChatAfter(factionId, afterId, limit)
          : await getRecentFactionChat(factionId, limit);
      return Response.json(
        {
          scope: "faction",
          messages,
          canSpeak: true,
          speaker: session.mc.username,
          factionId,
          factionName,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const messages =
      Number.isFinite(afterId) && afterId > 0
        ? await getGlobalChatAfter(afterId, limit)
        : await getRecentGlobalChat(limit);

    return Response.json(
      {
        scope: "global",
        messages,
        canSpeak: session.mc !== null,
        speaker: session.mc?.username ?? null,
        factionId,
        factionName,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/chat] lecture impossible :", error);
    return Response.json({ error: "Chat indisponible." }, { status: 503 });
  }
}

/**
 * POST /api/chat { message, scope?: 'global'|'faction' }
 */
export async function POST(request: Request) {
  const check = await requireLinked();
  if (!check.ok) return check.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const obj = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const message = sanitizeMessage(String(obj.message ?? ""));
  if (!message) {
    return Response.json(
      { error: `Message invalide (1–${CHAT_MESSAGE_MAX_LENGTH} caractères).` },
      { status: 400 },
    );
  }

  const scope = obj.scope === "faction" ? "faction" : "global";
  const uuid = check.user.mc!.uuid;
  if (isRateLimited(`${scope}:${uuid}`)) {
    return Response.json({ error: "Doucement — un message toutes les 3 secondes." }, { status: 429 });
  }

  let factionId: number | null = null;
  if (scope === "faction") {
    factionId = await getPlayerFactionId(uuid).catch(() => null);
    if (!factionId) {
      return Response.json({ error: "Tu n'es dans aucune faction." }, { status: 403 });
    }
  }

  const playerName = check.user.mc!.username?.trim() || check.user.discordUser?.username || "Joueur";

  try {
    const id = await enqueueChatMessage({
      playerUuid: uuid,
      playerName,
      message,
      factionId,
    });
    return Response.json(
      { ok: true, id, queued: true, scope },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/chat] envoi impossible :", error);
    return Response.json({ error: "Impossible d'envoyer le message." }, { status: 503 });
  }
}
