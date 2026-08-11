import { getSessionUser, requireLinked } from "@/server/session";
import {
  CHAT_MESSAGE_MAX_LENGTH,
  clampChatLimit,
  enqueueChatMessage,
  getChatMessagesAfter,
  getRecentChatMessages,
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
 * GET /api/chat?after=<id>&limit=80
 * Fil public (lecture anonyme). Sans after → derniers messages.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const afterRaw = params.get("after");
  const limit = clampChatLimit(params.get("limit") ?? undefined);

  try {
    const afterId = afterRaw ? Number.parseInt(afterRaw, 10) : 0;
    const messages =
      Number.isFinite(afterId) && afterId > 0
        ? await getChatMessagesAfter(afterId, limit)
        : await getRecentChatMessages(limit);

    const session = await getSessionUser();
    return Response.json(
      {
        messages,
        canSpeak: session.mc !== null,
        speaker: session.mc?.username ?? null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/chat] lecture impossible :", error);
    return Response.json({ error: "Chat indisponible." }, { status: 503 });
  }
}

/**
 * POST /api/chat { message }
 * Réservé aux comptes Discord liés à Minecraft.
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

  const messageRaw =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message ?? "")
      : "";
  const message = sanitizeMessage(messageRaw);
  if (!message) {
    return Response.json(
      { error: `Message invalide (1–${CHAT_MESSAGE_MAX_LENGTH} caractères, sans @everyone/@here).` },
      { status: 400 },
    );
  }

  const uuid = check.user.mc!.uuid;
  if (isRateLimited(uuid)) {
    return Response.json({ error: "Doucement — un message toutes les 3 secondes." }, { status: 429 });
  }

  const playerName = check.user.mc!.username?.trim() || check.user.discordUser?.username || "Joueur";

  try {
    const id = await enqueueChatMessage({
      playerUuid: uuid,
      playerName,
      message,
    });
    return Response.json(
      { ok: true, id, queued: true },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/chat] envoi impossible :", error);
    return Response.json({ error: "Impossible d'envoyer le message." }, { status: 503 });
  }
}
