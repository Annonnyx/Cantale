"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  claimsCentroid,
  factionStroke,
  parseMapSearch,
  worldLabel,
  type MapClaim,
  type MapClaimsPayload,
  type MapMarker,
  type MapMarkersPayload,
} from "@/lib/map-utils";
import { TerritoryCanvas, type MapFocus, type MapLayers } from "./territory-canvas";

/** Cadence de rafraîchissement silencieux, alignée sur le cache des routes. */
const REFRESH_MS = 30_000;

type FactionEntry = {
  id: number;
  name: string;
  tag: string;
  claimCount: number;
  pasdicCount: number;
  centroid: { x: number; z: number } | null;
};

/** « world » d'abord (convention Bukkit), sinon le monde le plus revendiqué. */
function pickDefaultWorld(claims: MapClaim[], markers: MapMarker[]): string {
  const counts = new Map<string, number>();
  for (const claim of claims) counts.set(claim.world, (counts.get(claim.world) ?? 0) + 1);
  if (counts.has("world")) return "world";
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best?.[0] ?? markers[0]?.world ?? "world";
}

function viewButtonClass(active: boolean): string {
  return `chip border px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] ${
    active
      ? "border-ember text-ember-glow"
      : "border-iron-line text-steel hover:border-steel hover:text-bone"
  }`;
}

export function MapExplorer({
  initialClaims,
  initialMarkers,
  generatedAt: initialGeneratedAt,
  providerUrl,
}: {
  initialClaims: MapClaim[];
  initialMarkers: MapMarker[];
  generatedAt: string;
  providerUrl: string | null;
}) {
  const [claims, setClaims] = useState(initialClaims);
  const [markers, setMarkers] = useState(initialMarkers);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [world, setWorld] = useState(() => pickDefaultWorld(initialClaims, initialMarkers));
  const [layers, setLayers] = useState<MapLayers>({ claims: true, pasdic: true, warps: true });
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [view, setView] = useState<"territoires" | "monde">("territoires");

  // Relevé silencieux : en cas d'échec (base ou réseau muet), on conserve le dernier.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const [claimsRes, markersRes] = await Promise.all([
          fetch("/api/map/claims"),
          fetch("/api/map/markers"),
        ]);
        if (cancelled) return;
        if (claimsRes.ok) {
          const data = (await claimsRes.json()) as MapClaimsPayload;
          setClaims(data.claims);
          setGeneratedAt(data.generatedAt);
        }
        if (markersRes.ok) {
          const data = (await markersRes.json()) as MapMarkersPayload;
          setMarkers(data.markers);
        }
      } catch {
        // Silence volontaire : le dernier relevé reste affiché.
      }
    };
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const worlds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const claim of claims) counts.set(claim.world, (counts.get(claim.world) ?? 0) + 1);
    for (const marker of markers) if (!counts.has(marker.world)) counts.set(marker.world, 0);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name)
      .sort((a, b) => (a === "world" ? -1 : b === "world" ? 1 : 0));
  }, [claims, markers]);

  const activeWorld = worlds.includes(world) ? world : (worlds[0] ?? "world");

  const worldClaims = useMemo(
    () => claims.filter((claim) => claim.world === activeWorld),
    [claims, activeWorld],
  );
  const worldMarkers = useMemo(
    () => markers.filter((marker) => marker.world === activeWorld),
    [markers, activeWorld],
  );

  const factions = useMemo<FactionEntry[]>(() => {
    const byId = new Map<
      number,
      { name: string; tag: string; points: { x: number; z: number }[]; pasdic: number }
    >();
    for (const claim of worldClaims) {
      let agg = byId.get(claim.faction.id);
      if (!agg) {
        agg = { name: claim.faction.name, tag: claim.faction.tag, points: [], pasdic: 0 };
        byId.set(claim.faction.id, agg);
      }
      agg.points.push({ x: claim.x, z: claim.z });
      if (claim.pasdic) agg.pasdic += 1;
    }
    return [...byId.entries()]
      .map(([id, agg]) => ({
        id,
        name: agg.name,
        tag: agg.tag,
        claimCount: agg.points.length,
        pasdicCount: agg.pasdic,
        centroid: claimsCentroid(agg.points),
      }))
      .sort((a, b) => b.claimCount - a.claimCount || a.name.localeCompare(b.name));
  }, [worldClaims]);

  const searchResults = useMemo(() => {
    const target = parseMapSearch(search);
    if (!target || target.type !== "text") return [];
    return factions
      .filter(
        (faction) =>
          faction.name.toLowerCase().includes(target.query) ||
          faction.tag.toLowerCase().includes(target.query),
      )
      .slice(0, 8);
  }, [factions, search]);

  const coordsTarget = useMemo(() => {
    const target = parseMapSearch(search);
    return target?.type === "coords" ? target : null;
  }, [search]);

  const focusNonce = useRef(0);
  const centerOn = (x: number, z: number) => {
    focusNonce.current += 1;
    setFocus({ x, z, nonce: focusNonce.current });
  };

  const selectFaction = (faction: FactionEntry) => {
    setHighlightId(faction.id);
    if (faction.centroid) centerOn(faction.centroid.x, faction.centroid.z);
    setSearch("");
  };

  const goToCoords = (x: number, z: number) => {
    setHighlightId(null);
    centerOn(x + 0.5, z + 0.5);
    setSearch("");
  };

  const toggleLayer = (key: keyof MapLayers) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const pasdicTotal = useMemo(() => worldClaims.filter((c) => c.pasdic).length, [worldClaims]);

  return (
    <section aria-label="Explorateur de la carte">
      {providerUrl && (
        <div className="flex flex-wrap gap-2 pb-4" role="group" aria-label="Choix de la vue">
          <button
            type="button"
            aria-pressed={view === "territoires"}
            onClick={() => setView("territoires")}
            className={viewButtonClass(view === "territoires")}
          >
            Territoires
          </button>
          <button
            type="button"
            aria-pressed={view === "monde"}
            onClick={() => setView("monde")}
            className={viewButtonClass(view === "monde")}
          >
            Carte du monde détaillée
          </button>
        </div>
      )}

      {view === "monde" && providerUrl ? (
        <div className="flex flex-col gap-3">
          <iframe
            src={providerUrl}
            title="Carte du monde détaillée"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-[62vh] min-h-[420px] w-full border border-iron-line bg-ash-deep"
          />
          <p className="text-xs leading-relaxed text-steel">
            La carte détaillée est servie par un outil externe.{" "}
            <a
              href={providerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone"
            >
              L&apos;ouvrir dans un nouvel onglet →
            </a>
          </p>
        </div>
      ) : (
        <>
          {worlds.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pb-4">
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                Monde
              </span>
              {worlds.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={name === activeWorld}
                  onClick={() => {
                    setWorld(name);
                    setHighlightId(null);
                    setFocus(null);
                    setSearch("");
                  }}
                  className={viewButtonClass(name === activeWorld)}
                >
                  {worldLabel(name)}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="relative h-[62vh] min-h-[420px] border border-iron-line bg-ash-deep">
              <TerritoryCanvas
                key={activeWorld}
                claims={worldClaims}
                markers={worldMarkers}
                layers={layers}
                focus={focus}
                highlightFactionId={highlightId}
              />
              {worldClaims.length === 0 && worldMarkers.length === 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
                  <p className="border border-iron-line bg-iron/90 px-4 py-2 text-center text-xs text-steel">
                    Aucun territoire revendiqué dans ce monde pour l&apos;instant.
                  </p>
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-6 border border-iron-line bg-iron p-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="map-search"
                  className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel"
                >
                  Rechercher
                </label>
                <input
                  id="map-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Faction, tag ou « x z »"
                  autoComplete="off"
                  className="border border-iron-line bg-ash-deep px-3 py-2 text-sm text-bone placeholder:text-steel/60 focus:border-ember focus:outline-none"
                />
                {coordsTarget && (
                  <button
                    type="button"
                    onClick={() => goToCoords(coordsTarget.x, coordsTarget.z)}
                    className="border border-iron-line bg-ash-deep px-3 py-2 text-left text-sm text-bone transition-colors hover:border-ember"
                  >
                    Aller au chunk {coordsTarget.x} · {coordsTarget.z}
                  </button>
                )}
                {searchResults.length > 0 && (
                  <ul className="flex flex-col border border-iron-line bg-ash-deep">
                    {searchResults.map((faction) => (
                      <li key={faction.id}>
                        <button
                          type="button"
                          onClick={() => selectFaction(faction)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-bone transition-colors hover:bg-iron-light"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0"
                            style={{ backgroundColor: factionStroke(faction.id) }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{faction.name}</span>
                          <span className="ml-auto font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                            [{faction.tag}]
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {search.trim() !== "" && !coordsTarget && searchResults.length === 0 && (
                  <p className="text-xs text-steel">Aucune faction ne répond à ce nom.</p>
                )}
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                  Couches
                </legend>
                <LayerToggle
                  active={layers.claims}
                  onToggle={() => toggleLayer("claims")}
                  swatchClass="bg-bone"
                  label="Territoires"
                />
                <LayerToggle
                  active={layers.pasdic}
                  onToggle={() => toggleLayer("pasdic")}
                  swatchClass="bg-gold"
                  label="Zones PASDIC"
                />
                <LayerToggle
                  active={layers.warps}
                  onToggle={() => toggleLayer("warps")}
                  swatchClass="rotate-45 bg-gold"
                  label="Warps publics"
                />
              </fieldset>

              <div className="flex flex-col gap-2">
                <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                  Repères
                </span>
                <ul className="flex flex-col gap-2 text-xs text-steel">
                  <li className="flex items-center gap-2.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <rect x="3" y="3" width="6" height="6" fill="#d9a441" transform="rotate(45 6 6)" />
                    </svg>
                    Warp public
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <circle cx="6" cy="6" r="5" fill="none" stroke="#e8703c" strokeOpacity="0.6" />
                      <rect x="3.5" y="3.5" width="5" height="5" fill="#e8703c" transform="rotate(45 6 6)" />
                    </svg>
                    Warp d&apos;événement
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <rect x="1" y="1" width="10" height="10" fill="none" stroke="#d9a441" strokeWidth="1.5" />
                      <path d="M1 8 8 1M4 11 11 4" stroke="#d9a441" strokeOpacity="0.6" />
                    </svg>
                    Zone PASDIC — territoire protégé
                  </li>
                </ul>
              </div>

              <div className="flex min-h-0 flex-col gap-2">
                <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                  Factions visibles — {factions.length}
                </span>
                {factions.length > 0 ? (
                  <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
                    {factions.map((faction) => (
                      <li key={faction.id}>
                        <button
                          type="button"
                          aria-pressed={highlightId === faction.id}
                          onClick={() => selectFaction(faction)}
                          className={`flex w-full items-center gap-2.5 border px-3 py-2 text-left transition-colors ${
                            highlightId === faction.id
                              ? "border-ember bg-ash-deep"
                              : "border-transparent hover:border-iron-line hover:bg-ash-deep"
                          }`}
                        >
                          <span
                            className="h-3 w-3 shrink-0"
                            style={{ backgroundColor: factionStroke(faction.id) }}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-bone">
                              {faction.name}
                            </span>
                            <span className="block font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                              [{faction.tag}] — {faction.claimCount} claim
                              {faction.claimCount > 1 ? "s" : ""}
                              {faction.pasdicCount > 0 ? `, dont ${faction.pasdicCount} PASDIC` : ""}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs leading-relaxed text-steel">
                    Aucune faction visible dans ce monde.
                  </p>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-2 border-t border-iron-line/60 pt-4">
                <p className="text-xs leading-relaxed text-steel">
                  Glisser pour déplacer, molette pour zoomer. Clavier : flèches pour
                  déplacer, + et − pour zoomer, 0 pour recentrer sur l&apos;origine.
                </p>
                <p className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                  {worldClaims.length} claim{worldClaims.length > 1 ? "s" : ""} — {pasdicTotal}{" "}
                  PASDIC — relevé {generatedAt.slice(11, 19)} UTC
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

function LayerToggle({
  active,
  label,
  swatchClass,
  onToggle,
}: {
  active: boolean;
  label: string;
  swatchClass: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`flex items-center gap-3 border px-3 py-2 text-left font-tech text-[11px] uppercase tracking-[0.2em] transition-colors ${
        active ? "border-ember text-bone" : "border-iron-line text-steel hover:border-steel"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 ${swatchClass} ${active ? "" : "opacity-30"}`}
      />
      {label}
    </button>
  );
}
