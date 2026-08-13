/**
 * Résolution serveur des textures Minecraft (approche NameMC) :
 * 1) crafthead + mc-heads en parallèle (PNG déjà rendus)
 * 2) Mojang session → textures.minecraft.net (skins seulement, repli)
 *
 * Évite CORS navigateur et les CDN flaky (ex. crafatar 521) en servant
 * les PNG depuis notre origine via /api/minecraft/*.
 *
 * Les candidats partent en parallèle (Promise.any) avec un timeout court :
 * un listing de 50 avatars ne doit pas attendre 8 s × N sources en série.
 */

const UA = "CantaleWorld/1.0 (+https://www.cantale.world)";
const FETCH_TIMEOUT_MS = 2_500;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 h
const NEGATIVE_TTL_MS = 2 * 60 * 1000; // 2 min — évite de re-tenter un 404 en boucle
const REVALIDATE_SEC = 21_600;

const NAME_RE = /^[a-zA-Z0-9_]{1,16}$/;

type CacheEntry = { body: ArrayBuffer; contentType: string; expires: number };
type NegativeEntry = { expires: number };

const skinCache = new Map<string, CacheEntry>();
const avatarCache = new Map<string, CacheEntry>();
const negativeSkin = new Map<string, NegativeEntry>();
const negativeAvatar = new Map<string, NegativeEntry>();

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
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": UA, Accept: "image/png,*/*" },
      redirect: "follow",
      next: { revalidate: REVALIDATE_SEC },
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
  }
}

/** Premier PNG valide parmi les URLs — les fetches partent ensemble. */
async function firstPng(urls: string[]): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return null;
  try {
    return await Promise.any(
      unique.map(async (url) => {
        const got = await fetchBytes(url);
        if (!got) throw new Error("miss");
        return got;
      }),
    );
  } catch {
    return null;
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
  try {
    const res = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`,
      {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": UA },
        next: { revalidate: REVALIDATE_SEC },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as MojangProfile;
    return data.id ? data.id.toLowerCase() : null;
  } catch {
    return null;
  }
}

async function skinUrlFromMojang(uuidNodash: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://sessionserver.mojang.com/session/minecraft/profile/${uuidNodash}`,
      {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": UA },
        next: { revalidate: REVALIDATE_SEC },
      },
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

function isNegative(map: Map<string, NegativeEntry>, key: string): boolean {
  const hit = map.get(key);
  if (!hit) return false;
  if (hit.expires < Date.now()) {
    map.delete(key);
    return false;
  }
  return true;
}

function putCache(map: Map<string, CacheEntry>, key: string, entry: Omit<CacheEntry, "expires">) {
  map.set(key, { ...entry, expires: Date.now() + CACHE_TTL_MS });
}

function putNegative(map: Map<string, NegativeEntry>, key: string) {
  map.set(key, { expires: Date.now() + NEGATIVE_TTL_MS });
}

/**
 * PNG skin 64×64. Crafthead + mc-heads en parallèle ; Mojang seulement en repli.
 */
export async function fetchMinecraftSkinPng(
  rawId: string,
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const id = normalizeId(rawId);
  if (!id) return null;

  const cacheKey = id.toLowerCase();
  const cached = fromCache(skinCache, cacheKey);
  if (cached) return { body: cached.body, contentType: cached.contentType };
  if (isNegative(negativeSkin, cacheKey)) return null;

  const { uuid, nameHint } = await resolveUuid(id);
  const candidates: string[] = [];

  if (uuid) {
    candidates.push(`https://crafthead.net/skin/${uuid}`);
    candidates.push(`https://mc-heads.net/skin/${uuid}`);
  }
  if (nameHint || (!uuid && NAME_RE.test(id))) {
    const name = nameHint ?? id;
    candidates.push(`https://crafthead.net/skin/${encodeURIComponent(name)}`);
    candidates.push(`https://mc-heads.net/skin/${encodeURIComponent(name)}`);
  }

  let got = await firstPng(candidates);
  if (!got && uuid) {
    const mojangUrl = await skinUrlFromMojang(uuid);
    if (mojangUrl) got = await fetchBytes(mojangUrl);
  }

  if (got) {
    putCache(skinCache, cacheKey, got);
    return got;
  }
  putNegative(negativeSkin, cacheKey);
  return null;
}

/**
 * Avatar tête 2D (rendu CDN). Crafthead et mc-heads en parallèle —
 * pas d'appel Mojang (inutile pour une tête 2D).
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
  if (isNegative(negativeAvatar, cacheKey)) return null;

  const { uuid, nameHint } = await resolveUuid(id);
  const key = uuid || nameHint || id;
  if (!key) {
    putNegative(negativeAvatar, cacheKey);
    return null;
  }

  const encoded = encodeURIComponent(key);
  const candidates = [
    `https://crafthead.net/avatar/${encoded}/${safeSize}`,
    `https://mc-heads.net/avatar/${encoded}/${safeSize}`,
  ];
  if (uuid) {
    candidates.push(`https://crafthead.net/avatar/${uuid}`);
  } else {
    candidates.push(`https://crafthead.net/avatar/${encoded}`);
  }

  const got = await firstPng(candidates);
  if (got) {
    putCache(avatarCache, cacheKey, got);
    return got;
  }
  putNegative(negativeAvatar, cacheKey);
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
      "CDN-Cache-Control": `public, s-maxage=${maxAgeSec}, stale-while-revalidate=86400`,
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function missingTextureResponse(kind: "avatar" | "skin"): Response {
  return new Response(kind === "avatar" ? "Avatar introuvable" : "Skin introuvable", {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=120, s-maxage=120",
      "CDN-Cache-Control": "public, s-maxage=120",
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
