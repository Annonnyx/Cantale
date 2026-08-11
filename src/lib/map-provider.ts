/**
 * Squaremap / BlueMap côté ops : MAP_PROVIDER_URL.
 *
 * Sur un site HTTPS, une iframe vers une URL HTTP est bloquée (mixed content).
 * On expose donc un reverse-proxy same-origin `/map-provider/*` (rewrite Next)
 * et l'iframe pointe toujours vers ce chemin quand le provider est HTTP.
 */

const PROXY_BASE = "/map-provider";

/** Origine (+ chemin de base éventuel) du provider, sans slash final. */
export function mapProviderUpstream(): string | null {
  const raw = process.env.MAP_PROVIDER_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

/**
 * URL à placer dans l'iframe / le lien « ouvrir ».
 * - HTTP upstream → `/map-provider/` (évite mixed content)
 * - HTTPS upstream → URL directe (moins de latence)
 */
export function mapProviderPublicUrl(): string | null {
  const raw = process.env.MAP_PROVIDER_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:") {
      return `${PROXY_BASE}/`;
    }
    if (url.protocol === "https:") {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export const MAP_PROVIDER_PROXY_SOURCE = PROXY_BASE;
