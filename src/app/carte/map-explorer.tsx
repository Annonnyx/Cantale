"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SERVER_SPAWN_BLOCK,
  claimsCentroid,
  factionStroke,
  worldLabel,
  type MapClaim,
  type MapClaimsPayload,
  type MapMarker,
  type MapMarkersPayload,
} from "@/lib/map-utils";
import { squaremapWorldForBukkit } from "@/lib/map-squaremap";
import { TerritoryCanvas, type MapFocus, type MapLayers } from "./territory-canvas";

/** Leaflet touche `window` — pas de SSR. */
const WorldMap = dynamic(
  () => import("./world-map").then((mod) => mod.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-ash-deep text-xs text-steel">
        Chargement de la carte…
      </div>
    ),
  },
);

/** Cadence de rafraîchissement silencieux, alignée sur le cache des routes. */
const REFRESH_MS = 30_000;

type FactionEntry = {
  id: number;
  name: string;
  tag: string;
  claimCount: number;
  pasdicCount: number;
  /** Centre en chunks (canvas) / dérivé en blocs pour Leaflet. */
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

function chipClass(active: boolean): string {
  return `chip border px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] ${
    active
      ? "border-ember text-ember-glow"
      : "border-iron-line text-steel hover:border-steel hover:text-bone"
  }`;
}

function parseCoordField(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "+") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function MapExplorer({
  initialClaims,
  initialMarkers,
  generatedAt: initialGeneratedAt,
  providerUrl,
  tileBase,
}: {
  initialClaims: MapClaim[];
  initialMarkers: MapMarker[];
  generatedAt: string;
  providerUrl: string | null;
  /** Base tuiles Squaremap (`/map-provider` ou HTTPS). Null → canvas seul. */
  tileBase: string | null;
}) {
  const [claims, setClaims] = useState(initialClaims);
  const [markers, setMarkers] = useState(initialMarkers);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [world, setWorld] = useState(() => pickDefaultWorld(initialClaims, initialMarkers));
  const [layers, setLayers] = useState<MapLayers>({ claims: true, pasdic: true, warps: true });
  const [factionQuery, setFactionQuery] = useState("");
  const [coordX, setCoordX] = useState(String(SERVER_SPAWN_BLOCK.x));
  const [coordZ, setCoordZ] = useState(String(SERVER_SPAWN_BLOCK.z));
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [cursorBlock, setCursorBlock] = useState<{ x: number; z: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const useTerrain = Boolean(tileBase);
  const focusNonce = useRef(0);

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

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const worlds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const claim of claims) counts.set(claim.world, (counts.get(claim.world) ?? 0) + 1);
    for (const marker of markers) if (!counts.has(marker.world)) counts.set(marker.world, 0);
    if (!counts.has("world")) counts.set("world", 0);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name)
      .sort((a, b) => (a === "world" ? -1 : b === "world" ? 1 : 0));
  }, [claims, markers]);

  const activeWorld = worlds.includes(world) ? world : (worlds[0] ?? "world");
  const squaremapWorld = squaremapWorldForBukkit(activeWorld);

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

  const factionResults = useMemo(() => {
    const q = factionQuery.trim().toLowerCase();
    if (!q) return factions.slice(0, 12);
    return factions
      .filter(
        (faction) =>
          faction.name.toLowerCase().includes(q) || faction.tag.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [factions, factionQuery]);

  /** Focus en blocs (Leaflet) ; canvas reçoit des chunks. */
  const centerOnBlocks = (x: number, z: number) => {
    focusNonce.current += 1;
    setFocus({ x, z, nonce: focusNonce.current });
  };

  /** Canvas attend des coords chunk ; on stocke le focus en blocs partout. */
  const canvasFocus = useMemo<MapFocus | null>(() => {
    if (!focus || useTerrain) return null;
    return {
      x: focus.x / 16,
      z: focus.z / 16,
      nonce: focus.nonce,
    };
  }, [focus, useTerrain]);

  const worldFocus = useTerrain ? focus : null;

  const selectFaction = (faction: FactionEntry) => {
    setHighlightId(faction.id);
    if (faction.centroid) {
      // Centroid = chunks continus (centres) → blocs
      const blockX = faction.centroid.x * 16;
      const blockZ = faction.centroid.z * 16;
      centerOnBlocks(blockX, blockZ);
      setCoordX(String(Math.round(blockX)));
      setCoordZ(String(Math.round(blockZ)));
    }
    setFactionQuery("");
  };

  const goToCoords = () => {
    const x = parseCoordField(coordX);
    const z = parseCoordField(coordZ);
    if (x === null || z === null) return;
    setHighlightId(null);
    centerOnBlocks(x, z);
  };

  const goToSpawn = () => {
    setHighlightId(null);
    setCoordX(String(SERVER_SPAWN_BLOCK.x));
    setCoordZ(String(SERVER_SPAWN_BLOCK.z));
    centerOnBlocks(SERVER_SPAWN_BLOCK.x, SERVER_SPAWN_BLOCK.z);
  };

  const toggleLayer = (key: keyof MapLayers) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleFullscreen = async () => {
    const el = mapShellRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // navigateurs sans Fullscreen API : ignore
    }
  };

  const pasdicTotal = useMemo(() => worldClaims.filter((c) => c.pasdic).length, [worldClaims]);

  return (
    <section aria-label="Explorateur de la carte">
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
                setFactionQuery("");
                setCoordX(String(SERVER_SPAWN_BLOCK.x));
                setCoordZ(String(SERVER_SPAWN_BLOCK.z));
              }}
              className={chipClass(name === activeWorld)}
            >
              {worldLabel(name)}
            </button>
          ))}
        </div>
      )}

      <div
        ref={mapShellRef}
        className={
          fullscreen
            ? "fixed inset-0 z-[80] flex flex-col gap-0 bg-ash-deep lg:flex-row"
            : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
        }
      >
        <div
          className={`relative border border-iron-line bg-ash-deep ${
            fullscreen
              ? "min-h-0 min-w-0 flex-1 border-0"
              : "h-[62vh] min-h-[420px]"
          }`}
        >
          <div className="absolute right-3 top-3 z-[1000] flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={goToSpawn}
              className="chip border border-iron-line bg-iron/90 px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.18em] text-steel hover:border-ember hover:text-bone"
              title={`Recentrer sur le spawn (${SERVER_SPAWN_BLOCK.x} · ${SERVER_SPAWN_BLOCK.z})`}
            >
              Spawn
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-pressed={fullscreen}
              className="chip border border-iron-line bg-iron/90 px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.18em] text-steel hover:border-ember hover:text-bone"
            >
              {fullscreen ? "Quitter" : "Plein écran"}
            </button>
            {providerUrl && (
              <a
                href={providerUrl}
                target="_blank"
                rel="noreferrer"
                className="chip border border-iron-line bg-iron/90 px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.18em] text-steel hover:border-ember hover:text-bone"
              >
                Ouvrir Squaremap →
              </a>
            )}
          </div>

          {useTerrain && tileBase ? (
            <WorldMap
              key={activeWorld}
              claims={worldClaims}
              markers={worldMarkers}
              layers={layers}
              focus={worldFocus}
              highlightFactionId={highlightId}
              squaremapWorld={squaremapWorld}
              tileBase={tileBase}
              onCursorBlock={setCursorBlock}
            />
          ) : (
            <TerritoryCanvas
              key={activeWorld}
              claims={worldClaims}
              markers={worldMarkers}
              layers={layers}
              focus={canvasFocus}
              highlightFactionId={highlightId}
            />
          )}

          {worldClaims.length === 0 && worldMarkers.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-14 z-[900] flex justify-center px-4">
              <p className="border border-iron-line bg-iron/90 px-4 py-2 text-center text-xs text-steel">
                Aucun territoire revendiqué dans ce monde pour l&apos;instant.
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute bottom-3 left-3 z-[900] border border-iron-line bg-iron/90 px-2.5 py-1 font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
            {cursorBlock
              ? `X ${cursorBlock.x} · Z ${cursorBlock.z}`
              : `Spawn ${SERVER_SPAWN_BLOCK.x} · ${SERVER_SPAWN_BLOCK.z}`}
          </div>
        </div>

        <aside
          className={`flex flex-col gap-6 border border-iron-line bg-iron p-5 ${
            fullscreen
              ? "max-h-[40vh] overflow-y-auto border-x-0 border-b-0 lg:max-h-none lg:w-80 lg:shrink-0 lg:border-y-0 lg:border-l lg:border-r-0"
              : ""
          }`}
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="map-faction-search"
              className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel"
            >
              Faction
            </label>
            <input
              id="map-faction-search"
              type="text"
              value={factionQuery}
              onChange={(event) => setFactionQuery(event.target.value)}
              placeholder="Nom ou tag"
              autoComplete="off"
              className="border border-iron-line bg-ash-deep px-3 py-2 text-sm text-bone placeholder:text-steel/60 focus:border-ember focus:outline-none"
            />
            {factionResults.length > 0 && (
              <ul className="flex max-h-40 flex-col overflow-y-auto border border-iron-line bg-ash-deep">
                {factionResults.map((faction) => (
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
            {factionQuery.trim() !== "" && factionResults.length === 0 && (
              <p className="text-xs text-steel">Aucune faction ne répond à ce nom.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Coordonnées (blocs)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                  X
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={coordX}
                  onChange={(event) => setCoordX(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") goToCoords();
                  }}
                  className="border border-iron-line bg-ash-deep px-3 py-2 text-sm text-bone focus:border-ember focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                  Z
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={coordZ}
                  onChange={(event) => setCoordZ(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") goToCoords();
                  }}
                  className="border border-iron-line bg-ash-deep px-3 py-2 text-sm text-bone focus:border-ember focus:outline-none"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={goToCoords}
              className="pressable border border-ember bg-ash-deep px-3 py-2 font-tech text-[10px] uppercase tracking-[0.22em] text-ember-glow hover:text-bone"
            >
              Aller
            </button>
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
                <span className="h-2.5 w-2.5 rotate-45 bg-gold" aria-hidden="true" />
                Warp public
              </li>
              <li className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rotate-45 bg-ember-glow ring-1 ring-ember"
                  aria-hidden="true"
                />
                Warp d&apos;événement
              </li>
              <li className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 border border-dashed border-gold bg-transparent"
                  aria-hidden="true"
                />
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
              {useTerrain
                ? "Tuiles Squaremap + territoires Cantale. Glisser pour déplacer, molette pour zoomer. Spawn par défaut : "
                : "Carte schématique (provider indisponible). Glisser pour déplacer, molette pour zoomer. Spawn par défaut : "}
              {SERVER_SPAWN_BLOCK.x} · {SERVER_SPAWN_BLOCK.z}.
            </p>
            <p className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
              {worldClaims.length} claim{worldClaims.length > 1 ? "s" : ""} — {pasdicTotal}{" "}
              PASDIC — relevé {generatedAt.slice(11, 19)} UTC
            </p>
          </div>
        </aside>
      </div>
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
