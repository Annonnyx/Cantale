import {
  discordChannelNamePart,
  formatDiscordAccountLabel,
  getSessionDiscordUser,
} from "@/server/session";
import {
  createPartnershipTicket,
  type TicketField,
} from "@/server/discord-tickets";
import {
  ALLIANCE_TYPES,
  DISCORD_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  NAME_MAX_LENGTH,
  PRESENCE_MAX_LENGTH,
  getAllianceTypeById,
  type AllianceTypeDefinition,
} from "@/app/partenariats/alliance-types";

export const dynamic = "force-dynamic";

/**
 * Réception des demandes de partenariat : validation, anti-spam
 * (honeypot + Turnstile optionnel), rate limit par IP, ticket Discord.
 */

/* ——— Limitation en mémoire : 3 demandes / heure / IP ——— */
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 3;
const hitsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (hitsByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    hitsByIp.set(ip, hits);
    return true;
  }
  hits.push(now);
  hitsByIp.set(ip, hits);
  if (hitsByIp.size > 5000) {
    for (const [key, list] of hitsByIp) {
      if (list.every((t) => now - t >= RATE_WINDOW_MS)) hitsByIp.delete(key);
    }
  }
  return false;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

type RawPayload = {
  allianceType?: unknown;
  name?: unknown;
  discord?: unknown;
  presence?: unknown;
  message?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

type ValidatedPartnership = {
  allianceType: AllianceTypeDefinition;
  name: string;
  discord: string;
  presence: string;
  message: string;
};

function asString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validatePayload(body: RawPayload): { error: string } | { data: ValidatedPartnership } {
  const allianceType = getAllianceTypeById(asString(body.allianceType, 40));
  if (!allianceType || !ALLIANCE_TYPES.some((type) => type.id === allianceType.id)) {
    return { error: "Type d'alliance invalide." };
  }

  const name = asString(body.name, NAME_MAX_LENGTH);
  if (name.length < 2) {
    return { error: "Indique ton nom ou pseudo (au moins 2 caractères)." };
  }

  const discord = asString(body.discord, DISCORD_MAX_LENGTH);
  if (discord.length < 2) {
    return { error: "Indique ton Discord (tag ou ID) — requis pour te recontacter." };
  }

  const presence = asString(body.presence, PRESENCE_MAX_LENGTH);
  if (allianceType.presenceRequired && !presence) {
    return {
      error: "Indique ton site, réseau ou serveur — requis pour ce type d'alliance.",
    };
  }

  const message = asString(body.message, MESSAGE_MAX_LENGTH + 100);
  if (message.length < MESSAGE_MIN_LENGTH) {
    return {
      error: `Ton message doit faire au moins ${MESSAGE_MIN_LENGTH} caractères — présente ton projet clairement.`,
    };
  }
  if (message.length > MESSAGE_MAX_LENGTH) {
    return { error: `Le message ne doit pas dépasser ${MESSAGE_MAX_LENGTH} caractères.` };
  }

  return { data: { allianceType, name, discord, presence, message } };
}

function buildTicketFields(data: ValidatedPartnership, linkedDiscord: string): TicketField[] {
  const fields: TicketField[] = [
    { name: "Type d'alliance", value: data.allianceType.label, inline: true },
    { name: "Nom / pseudo", value: data.name, inline: true },
    { name: "Discord (déclaré)", value: data.discord, inline: true },
    { name: "Compte Discord lié", value: linkedDiscord, inline: true },
  ];
  if (data.presence) {
    fields.push({ name: "Site / réseau / serveur", value: data.presence, inline: false });
  }
  fields.push({ name: "Message / pitch", value: data.message, inline: false });
  return fields;
}

export async function POST(request: Request) {
  let body: RawPayload;
  try {
    body = (await request.json()) as RawPayload;
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  if (asString(body.website, 200)) {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Trop de demandes envoyées. Réessaie dans une heure." },
      { status: 429 },
    );
  }

  const validated = validatePayload(body);
  if ("error" in validated) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const turnstileToken = asString(body.turnstileToken, 2048);
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return Response.json(
      { error: "La vérification anti-robot a échoué. Recharge la page et réessaie." },
      { status: 400 },
    );
  }

  const discordUser = await getSessionDiscordUser(request);
  const linkedDiscord = formatDiscordAccountLabel(discordUser);
  // Nom de salon : handle Discord si connecté, sinon le nom déclaré (comme avant).
  const applicantName = discordUser
    ? discordChannelNamePart(discordUser)
    : validated.data.name;

  const result = await createPartnershipTicket({
    allianceTypeId: validated.data.allianceType.id,
    allianceTypeLabel: validated.data.allianceType.label,
    applicantName,
    applicantDiscordId: discordUser?.id ?? null,
    fields: buildTicketFields(validated.data, linkedDiscord),
  });

  if (!result.ok) {
    return Response.json(
      { error: `Le ticket Discord n'a pas pu être créé. ${result.error}` },
      { status: 503 },
    );
  }

  return Response.json({ ok: true, channel: result.channelName });
}
