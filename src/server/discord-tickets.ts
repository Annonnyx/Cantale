import { env, DISCORD_ROLES, DISCORD_TICKET_CATEGORY } from "./env";

/**
 * Création de tickets Discord via l'API REST (token bot), sans dépendance.
 * Reprend les conventions du TicketListener Java (bot natif) pour que les
 * tickets web se comportent comme les tickets créés en jeu :
 *  - nom de salon normalisé (minuscules, tirets, max 100 caractères)
 *  - topic "ticket:<ownerId>:<raison>" — la commande /ticket close du bot
 *    natif fonctionne donc aussi sur les tickets ouverts depuis le site
 *  - mêmes permissions : @everyone masqué, staff + demandeur en accès
 * Jamais d'exception : toute défaillance se résout en { ok: false, error }.
 */

const DISCORD_API = "https://discord.com/api/v10";

/** Bits de permission Discord. */
const PERM_VIEW_CHANNEL = 1024; // 1 << 10
const PERM_SEND_MESSAGES = 2048; // 1 << 11
const PERM_ATTACH_FILES = 32768; // 1 << 15
/** Mêmes droits que les tickets natifs : voir, écrire, joindre des fichiers. */
const TICKET_ALLOW = String(PERM_VIEW_CHANNEL + PERM_SEND_MESSAGES + PERM_ATTACH_FILES);
const DENY_ALL = "0";

/** Couleur ember de la DA « Le Registre ». */
const EMBED_COLOR = 0xc6491f;

const MAX_CHANNEL_NAME_LENGTH = 100;
const MAX_FIELD_VALUE_LENGTH = 1024; // limite Discord par field d'embed

export type TicketField = {
  name: string;
  value: string;
  /** Champ court affiché en colonne (défaut : pleine largeur). */
  inline?: boolean;
};

/** Alias conservé pour les imports recrutement existants. */
export type RecruitmentTicketField = TicketField;

export type RecruitmentTicketInput = {
  /** Identifiant technique du rôle (ex. "moderation") — utilisé dans le nom du salon. */
  roleId: string;
  /** Libellé affiché du rôle (ex. "Modération") — utilisé dans l'embed. */
  roleLabel: string;
  /** Nom du candidat pour le nom du salon (pseudo Discord, Minecraft ou "candidat"). */
  applicantName: string;
  /** ID Discord du candidat s'il est connecté — accès au salon + mention. */
  applicantDiscordId: string | null;
  /** Champs de l'embed, dans l'ordre d'affichage. */
  fields: TicketField[];
};

export type PartnershipTicketInput = {
  /** Identifiant technique du type d'alliance (ex. "communaute"). */
  allianceTypeId: string;
  /** Libellé affiché (ex. "Serveurs & communautés"). */
  allianceTypeLabel: string;
  /** Nom / pseudo pour le nom du salon. */
  applicantName: string;
  /** ID Discord du demandeur s'il est connecté — accès au salon + mention. */
  applicantDiscordId: string | null;
  /** Champs de l'embed, dans l'ordre d'affichage. */
  fields: TicketField[];
};

export type CreateTicketResult =
  | { ok: true; channelId: string; channelName: string }
  | { ok: false; error: string };

type PermissionOverwrite = {
  id: string;
  /** 0 = rôle, 1 = membre. */
  type: 0 | 1;
  allow: string;
  deny: string;
};

type WebTicketInput = {
  /** Préfixe du salon (ex. "recrutement", "partenariat"). */
  channelPrefix: string;
  /** Segment type dans le nom du salon (ex. "moderation", "communaute"). */
  nameSlug: string;
  /** Segment raison pour le topic (ex. "recrutement-moderation"). */
  reasonSlug: string;
  /** Titre de l'embed. */
  embedTitle: string;
  /** Catégorie Discord parente. */
  categoryId: string;
  /** Fallback si le nom est vide après sanitization. */
  nameFallback: string;
  applicantName: string;
  applicantDiscordId: string | null;
  fields: TicketField[];
};

/** Normalise une partie de nom de salon : minuscules, chiffres et tirets uniquement. */
function sanitizeNamePart(value: string, fallback: string): string {
  const out = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return out || fallback;
}

/** Nom de salon style ticket natif : "<prefix>-<slug>-<nom>" (max 100 car.). */
function buildTicketChannelName(
  prefix: string,
  slug: string,
  applicantName: string,
  nameFallback: string,
): string {
  const name = `${sanitizeNamePart(prefix, "ticket")}-${sanitizeNamePart(slug, "demande")}-${sanitizeNamePart(applicantName, nameFallback)}`;
  return name.length > MAX_CHANNEL_NAME_LENGTH ? name.slice(0, MAX_CHANNEL_NAME_LENGTH) : name;
}

function buildPermissionOverwrites(applicantDiscordId: string | null, guildId: string): PermissionOverwrite[] {
  const overwrites: PermissionOverwrite[] = [
    // @everyone : le salon est invisible pour le reste du serveur
    { id: guildId, type: 0, allow: DENY_ALL, deny: String(PERM_VIEW_CHANNEL) },
    // Direction : fondateur, co-fondateur, directeur
    { id: DISCORD_ROLES.fondateur, type: 0, allow: TICKET_ALLOW, deny: DENY_ALL },
    { id: DISCORD_ROLES.coFondateur, type: 0, allow: TICKET_ALLOW, deny: DENY_ALL },
    { id: DISCORD_ROLES.directeur, type: 0, allow: TICKET_ALLOW, deny: DENY_ALL },
  ];
  if (applicantDiscordId) {
    overwrites.push({ id: applicantDiscordId, type: 1, allow: TICKET_ALLOW, deny: DENY_ALL });
  }
  return overwrites;
}

function buildEmbed(title: string, fields: TicketField[]) {
  return {
    title,
    color: EMBED_COLOR,
    fields: fields.slice(0, 25).map((field) => ({
      name: field.name.slice(0, 256),
      value: (field.value.trim() || "—").slice(0, MAX_FIELD_VALUE_LENGTH),
      inline: field.inline ?? field.value.length <= 80,
    })),
    footer: { text: "via cantale.world" },
    timestamp: new Date().toISOString(),
  };
}

function buildMentionContent(applicantDiscordId: string | null): string {
  const mentions = [
    `<@&${DISCORD_ROLES.fondateur}>`,
    `<@&${DISCORD_ROLES.coFondateur}>`,
    `<@&${DISCORD_ROLES.directeur}>`,
  ];
  if (applicantDiscordId) mentions.push(`<@${applicantDiscordId}>`);
  return mentions.join(" ");
}

async function discordFetch(path: string, token: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(`${DISCORD_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

/**
 * Crée le salon ticket puis y poste l'embed.
 * Renvoie ok:true uniquement si le salon existe ET que l'embed est posté —
 * un salon vide ne sert à rien, autant signaler l'échec à l'appelant.
 */
async function createWebTicket(input: WebTicketInput): Promise<CreateTicketResult> {
  const token = env.discordBotToken;
  const guildId = env.discordGuildId;
  if (!token || !guildId) {
    return { ok: false, error: "Intégration Discord non configurée." };
  }

  const channelName = buildTicketChannelName(
    input.channelPrefix,
    input.nameSlug,
    input.applicantName,
    input.nameFallback,
  );
  // Topic compatible avec le bot natif : "ticket:<ownerId>:<raison>".
  const topic = `ticket:${input.applicantDiscordId ?? "web"}:${sanitizeNamePart(input.reasonSlug, input.channelPrefix)}`;

  const createRes = await discordFetch(`/guilds/${guildId}/channels`, token, {
    method: "POST",
    body: JSON.stringify({
      name: channelName,
      type: 0, // salon textuel
      parent_id: input.categoryId,
      topic,
      permission_overwrites: buildPermissionOverwrites(input.applicantDiscordId, guildId),
    }),
  });
  if (!createRes) {
    return { ok: false, error: "Impossible de joindre l'API Discord." };
  }
  if (!createRes.ok) {
    return { ok: false, error: `Discord a refusé la création du salon (HTTP ${createRes.status}).` };
  }

  const channel = (await createRes.json().catch(() => null)) as { id?: string } | null;
  if (!channel?.id) {
    return { ok: false, error: "Réponse Discord illisible après création du salon." };
  }

  const messageRes = await discordFetch(`/channels/${channel.id}/messages`, token, {
    method: "POST",
    body: JSON.stringify({
      content: buildMentionContent(input.applicantDiscordId),
      embeds: [buildEmbed(input.embedTitle, input.fields)],
    }),
  });
  if (!messageRes || !messageRes.ok) {
    return {
      ok: false,
      error: "Salon créé mais le message n'a pas pu être posté.",
    };
  }

  return { ok: true, channelId: channel.id, channelName };
}

export async function createRecruitmentTicket(input: RecruitmentTicketInput): Promise<CreateTicketResult> {
  return createWebTicket({
    channelPrefix: "recrutement",
    nameSlug: input.roleId,
    reasonSlug: `recrutement-${input.roleId}`,
    embedTitle: `Candidature — ${input.roleLabel}`,
    categoryId: DISCORD_TICKET_CATEGORY,
    nameFallback: "candidat",
    applicantName: input.applicantName,
    applicantDiscordId: input.applicantDiscordId,
    fields: input.fields,
  });
}

/**
 * Ticket partenariat : même catégorie support que le recrutement par défaut,
 * ou `DISCORD_PARTNERSHIPS_CATEGORY_ID` si renseignée.
 */
export async function createPartnershipTicket(input: PartnershipTicketInput): Promise<CreateTicketResult> {
  const categoryId = env.discordPartnershipsCategoryId ?? DISCORD_TICKET_CATEGORY;
  return createWebTicket({
    channelPrefix: "partenariat",
    nameSlug: input.allianceTypeId,
    reasonSlug: `partenariat-${input.allianceTypeId}`,
    embedTitle: `Partenariat — ${input.allianceTypeLabel}`,
    categoryId,
    nameFallback: "partenaire",
    applicantName: input.applicantName,
    applicantDiscordId: input.applicantDiscordId,
    fields: input.fields,
  });
}
