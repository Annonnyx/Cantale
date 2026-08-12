import path from "node:path";
import type { NextConfig } from "next";

/**
 * Reverse-proxy Squaremap/BlueMap → `/map-provider/*`.
 * Nécessaire quand MAP_PROVIDER_URL est en HTTP : une iframe HTTP depuis
 * https://www.cantale.world est bloquée par les navigateurs (mixed content).
 * Squaremap sert des chemins relatifs (`./assets/…`, `tiles/…`) — le préfixe
 * `/map-provider/` suffit pour assets + tuiles (pas de WebSocket requis).
 *
 * `tiles/players.json` est volontairement détourné vers un stub vide :
 * pas de positions joueurs live sur cantale.world (Leaflet n'en charge aucun,
 * et l'UI Squaremap proxifiée non plus).
 */
function mapProviderRewrites(): { source: string; destination: string }[] {
  const raw = process.env.MAP_PROVIDER_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return [];
    const basePath = url.pathname.replace(/\/+$/, "");
    const upstream = `${url.origin}${basePath}`;
    return [
      {
        source: "/map-provider/tiles/players.json",
        destination: "/api/map/squaremap-players",
      },
      { source: "/map-provider", destination: `${upstream}/` },
      { source: "/map-provider/", destination: `${upstream}/` },
      { source: "/map-provider/:path*", destination: `${upstream}/:path*` },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return mapProviderRewrites();
  },
};

export default nextConfig;
