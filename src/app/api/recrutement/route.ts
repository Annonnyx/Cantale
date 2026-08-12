import {
  discordChannelNamePart,
  formatDiscordAccountLabel,
  getSessionDiscordUser,
} from "@/server/session";
import {
  createRecruitmentTicket,
  type RecruitmentTicketField,
} from "@/server/discord-tickets";
import {
  getRoleById,
  getExperienceLabel,
  EXPERIENCE_LEVELS,
  MOTIVATION_MIN_LENGTH,
  MOTIVATION_MAX_LENGTH,
  LINK_MAX_LENGTH,
  MINECRAFT_PSEUDO_PATTERN,
} from "@/app/recrutement/roles";

export const dynamic = "force-dynamic";

/**
 * Réception des candidatures : validation complète, anti-spam (honeypot +
 * Turnstile optionnel), limitation par IP, puis ouverture d'un ticket Discord.
 * Jamais de stack trace côté client — chaque échec renvoie un message propre.
 */

const LINK_KEYS = ["discord", "instagram", "tiktok", "email", "portfolio", "autre"] as const;
type LinkKey = (typeof LINK_KEYS)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ——— Limitation en mémoire : 3 candidatures / heure / IP ——— */
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
  // Garde-fou mémoire : ne pas laisser la map grossir sans fin.
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

/* ——— Cloudflare Turnstile : vérifié uniquement si la clé secrète est posée ——— */
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // widget non configuré : honeypot seul
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

/* ——— Validation du payload ——— */
type RawPayload = {
  role?: unknown;
  fields?: unknown;
  minecraftPseudo?: unknown;
  links?: unknown;
  experience?: unknown;
  motivation?: unknown;
  consent?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

function asString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validatePayload(body: RawPayload): { error: string } | { data: ValidatedApplication } {
  const role = getRoleById(asString(body.role, 40));
  if (!role) return { error: "Poste invalide." };

  const rawFields = (body.fields ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const field of role.fields) {
    const value = asString(rawFields[field.id], field.maxLength);
    if (field.required && !value) {
      return { error: `Le champ « ${field.label} » est requis.` };
    }
    fields[field.id] = value;
  }

  const experience = asString(body.experience, 20);
  if (!EXPERIENCE_LEVELS.some((level) => level.id === experience)) {
    return { error: "Niveau d'expérience invalide." };
  }

  const motivation = asString(body.motivation, MOTIVATION_MAX_LENGTH + 100);
  if (motivation.length < MOTIVATION_MIN_LENGTH) {
    return { error: `La motivation doit faire au moins ${MOTIVATION_MIN_LENGTH} caractères.` };
  }
  if (motivation.length > MOTIVATION_MAX_LENGTH) {
    return { error: `La motivation ne doit pas dépasser ${MOTIVATION_MAX_LENGTH} caractères.` };
  }

  const minecraftPseudo = asString(body.minecraftPseudo, 20);
  if (minecraftPseudo && !MINECRAFT_PSEUDO_PATTERN.test(minecraftPseudo)) {
    return { error: "Pseudo Minecraft invalide (3 à 16 caractères : lettres, chiffres, underscore)." };
  }

  const rawLinks = (body.links ?? {}) as Record<string, unknown>;
  const links: Partial<Record<LinkKey, string>> = {};
  for (const key of LINK_KEYS) {
    const value = asString(rawLinks[key], LINK_MAX_LENGTH);
    if (value) links[key] = value;
  }
  if (links.email && !EMAIL_PATTERN.test(links.email)) {
    return { error: "Adresse e-mail invalide." };
  }

  if (body.consent !== true) {
    return { error: "Le consentement est requis pour transmettre la candidature." };
  }

  return {
    data: { role, fields, experience, motivation, minecraftPseudo, links },
  };
}

type ValidatedApplication = {
  role: NonNullable<ReturnType<typeof getRoleById>>;
  fields: Record<string, string>;
  experience: string;
  motivation: string;
  minecraftPseudo: string;
  links: Partial<Record<LinkKey, string>>;
};

const LINK_LABELS: Record<LinkKey, string> = {
  discord: "Discord",
  instagram: "Instagram",
  tiktok: "TikTok",
  email: "E-mail",
  portfolio: "Portfolio",
  autre: "Autre",
};

/** Assemble les champs de l'embed Discord dans l'ordre d'affichage. */
function buildTicketFields(
  app: ValidatedApplication,
  discordAccount: string,
): RecruitmentTicketField[] {
  const fields: RecruitmentTicketField[] = [
    { name: "Poste", value: app.role.title, inline: true },
    { name: "Pseudo Minecraft", value: app.minecraftPseudo || "Non renseigné", inline: true },
    { name: "Expérience", value: getExperienceLabel(app.experience), inline: true },
    { name: "Compte Discord", value: discordAccount, inline: true },
  ];
  for (const field of app.role.fields) {
    const value = app.fields[field.id];
    if (value) fields.push({ name: field.label, value });
  }
  const linkLines = LINK_KEYS.filter((key) => app.links[key]).map(
    (key) => `${LINK_LABELS[key]} : ${app.links[key]}`,
  );
  if (linkLines.length > 0) {
    fields.push({ name: "Liens utiles", value: linkLines.join("\n"), inline: false });
  }
  fields.push({ name: "Motivation", value: app.motivation, inline: false });
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

  // Honeypot : un humain ne voit jamais ce champ — refus silencieux.
  if (asString(body.website, 200)) {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Trop de candidatures envoyées. Réessaie dans une heure." },
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

  // Cookie seul — ne pas passer par getSessionUser() (MySQL / rôles) :
  // un échec avalé via .catch laissait « Compte Discord non connecté »
  // alors que la page affichait déjà l'utilisateur connecté.
  const discordUser = await getSessionDiscordUser(request);
  const applicantName = discordUser
    ? discordChannelNamePart(discordUser)
    : validated.data.minecraftPseudo || "candidat";
  const discordAccount = formatDiscordAccountLabel(discordUser);

  const result = await createRecruitmentTicket({
    roleId: validated.data.role.id,
    roleLabel: validated.data.role.title,
    applicantName,
    applicantDiscordId: discordUser?.id ?? null,
    fields: buildTicketFields(validated.data, discordAccount),
  });

  if (!result.ok) {
    return Response.json(
      { error: `Le ticket Discord n'a pas pu être créé. ${result.error}` },
      { status: 503 },
    );
  }

  return Response.json({ ok: true, channel: result.channelName });
}
