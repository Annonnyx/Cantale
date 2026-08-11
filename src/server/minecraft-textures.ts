/**
 * Résolution serveur des textures Minecraft (approche NameMC) :
 * 1) Mojang session → textures.minecraft.net
 * 2) crafthead.net
 * 3) mc-heads.net
 *
 * Évite CORS navigateur et les CDN flaky (ex. crafatar 521) en servant
 * les PNG depuis notre origine via /api/minecraft/*.
 */

const UA = "CantaleWorld/1.0 (+https://www.cantale.world)";
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 h

const NAME_RE = /^[a-zA-Z0-9_]{1,16}$/;

type CacheEntry = { body: ArrayBuffer; contentType: string; expires: number };

const skinCache = new Map<string, CacheEntry>();
const avatarCache = new Map<string, CacheEntry>();

function normalizeId(raw: string): string {
  return decodeURIComponent(raw).trim();
}

/** UUID sans tirets pour l'API session Mojang. */
export function uuidNoDashes(id: string): string | null {
  const cleaned = id.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(cleaned)) return null;
  return cleaned;
}

function looksLikeUuid(id: string): boolean {
  const nd = id.replace(/-/g, "");
  return /^[0-9a-f]{32}$/i.test(nd);
}

async function fetchBytes(url: string): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "image/png,*/*" },
      redirect: "follow",
      // Mojang / CDN : pas de cache Next agressif, on gère TTL maison.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("image") && !contentType.includes("octet-stream")) {
      return null;
    }
    const body = await res.arrayBuffer();
    if (body.byteLength < 64) return null;
    return { body, contentType: contentType.includes("png") ? "image/png" : contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type MojangProfile = { id: string; name: string };
type SessionProfile = {
  id: string;
  name: string;
  properties?: Array<{ name: string; value: string }>;
};
type TexturePayload = {
  textures?: { SKIN?: { url?: string } };
};

async function resolveUuidFromName(name: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`,
      { signal: controller.signal, headers: { "User-Agent": UA }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as MojangProfile;
    return data.id ? data.id.toLowerCase() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function skinUrlFromMojang(uuidNodash: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://sessionserver.mojang.com/session/minecraft/profile/${uuidNodash}`,
      { signal: controller.signal, headers: { "User-Agent": UA }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as SessionProfile;
    const prop = data.properties?.find((p) => p.name === "textures");
    if (!prop?.value) return null;
    const decoded = JSON.parse(
      Buffer.from(prop.value, "base64").toString("utf8"),
    ) as TexturePayload;
    const url = decoded.textures?.SKIN?.url;
    if (!url) return null;
    return url.replace(/^http:\/\//i, "https://");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveUuid(id: string): Promise<{ uuid: string; nameHint: string | null }> {
  if (looksLikeUuid(id)) {
    return { uuid: uuidNoDashes(id)!, nameHint: null };
  }
  if (!NAME_RE.test(id)) {
    return { uuid: "", nameHint: null };
  }
  const uuid = await resolveUuidFromName(id);
  return { uuid: uuid ?? "", nameHint: id };
}

function fromCache(map: Map<string, CacheEntry>, key: string): CacheEntry | null {
  const hit = map.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    map.delete(key);
    return null;
  }
  return hit;
}

function putCache(map: Map<string, CacheEntry>, key: string, entry: Omit<CacheEntry, "expires">) {
  map.set(key, { ...entry, expires: Date.now() + CACHE_TTL_MS });
}

/**
 * PNG skin 64×64. Préfère Mojang → crafthead → mc-heads.
 */
export async function fetchMinecraftSkinPng(
  rawId: string,
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const id = normalizeId(rawId);
  if (!id) return null;

  const cacheKey = id.toLowerCase();
  const cached = fromCache(skinCache, cacheKey);
  if (cached) return { body: cached.body, contentType: cached.contentType };

  const { uuid, nameHint } = await resolveUuid(id);
  const candidates: string[] = [];

  if (uuid) {
    const mojangUrl = await skinUrlFromMojang(uuid);
    if (mojangUrl) candidates.push(mojangUrl);
    candidates.push(`https://crafthead.net/skin/${uuid}`);
    candidates.push(`https://mc-heads.net/skin/${uuid}`);
  }
  if (nameHint || (!uuid && NAME_RE.test(id))) {
    const name = nameHint ?? id;
    candidates.push(`https://crafthead.net/skin/${encodeURIComponent(name)}`);
    candidates.push(`https://mc-heads.net/skin/${encodeURIComponent(name)}`);
  }

  for (const url of candidates) {
    const got = await fetchBytes(url);
    if (got) {
      putCache(skinCache, cacheKey, got);
      return got;
    }
  }
  return null;
}

/**
 * Avatar tête 2D (rendu CDN). crafthead puis mc-heads — toujours côté serveur.
 */
export async function fetchMinecraftAvatarPng(
  rawId: string,
  size: number,
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const id = normalizeId(rawId);
  if (!id) return null;
  const safeSize = Number.isFinite(size) ? Math.min(512, Math.max(16, Math.round(size))) : 160;

  const cacheKey = `${id.toLowerCase()}:${safeSize}`;
  const cached = fromCache(avatarCache, cacheKey);
  if (cached) return { body: cached.body, contentType: cached.contentType };

  const { uuid, nameHint } = await resolveUuid(id);
  const key = uuid || nameHint || id;
  if (!key) return null;

  const encoded = encodeURIComponent(key);
  const candidates = [
    `https://crafthead.net/avatar/${encoded}/${safeSize}`,
    `https://mc-heads.net/avatar/${encoded}/${safeSize}`,
  ];
  // Repli sans taille (crafthead défaut ~180px) si les URLs dimensionnées échouent.
  if (uuid) {
    candidates.push(`https://crafthead.net/avatar/${uuid}`);
  } else {
    candidates.push(`https://crafthead.net/avatar/${encoded}`);
  }

  for (const url of candidates) {
    const got = await fetchBytes(url);
    if (got) {
      putCache(avatarCache, cacheKey, got);
      return got;
    }
  }
  return null;
}

export function pngResponse(
  body: ArrayBuffer,
  contentType: string,
  maxAgeSec = 21_600,
): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType || "image/png",
      "Cache-Control": `public, max-age=${maxAgeSec}, s-maxage=${maxAgeSec}, stale-while-revalidate=86400`,
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Valide l'identifiant de route (UUID ou pseudo). */
export function isValidMinecraftId(raw: string): boolean {
  const id = normalizeId(raw);
  if (!id || id.length > 36) return false;
  if (looksLikeUuid(id)) return true;
  return NAME_RE.test(id);
}
