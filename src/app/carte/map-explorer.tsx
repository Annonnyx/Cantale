"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SERVER_SPAWN_BLOCK,
  claimsCentroid,
  claimKey,
  claimKeyOf,
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

type SearchHit =
  | { kind: "faction"; faction: FactionEntry }
  | { kind: "warp"; marker: MapMarker; key: string };

type PasdicRefused = { w: string; x: number; z: number; reason: string };

type PasdicFeedback = {
  ok: number;
  refused: PasdicRefused[];
  error?: string;
};

const PASDIC_REASON_LABEL: Record<string, string> = {
  spawners: "spawners",
  stockage: "stockage",
  "stockage+spawners": "stockage + spawners",
  wilderness: "pas un claim",
  monde: "monde hors-ligne",
  chargement: "chunk illisible — inspecte en jeu",
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
  isAdmin = false,
}: {
  initialClaims: MapClaim[];
  initialMarkers: MapMarker[];
  generatedAt: string;
  providerUrl: string | null;
  /** Base tuiles Squaremap (`/map-provider` ou HTTPS). Null → canvas seul. */
  tileBase: string | null;
  isAdmin?: boolean;
}) {
  const [claims, setClaims] = useState(initialClaims);
  const [markers, setMarkers] = useState(initialMarkers);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [world, setWorld] = useState(() => pickDefaultWorld(initialClaims, initialMarkers));
  const [claimsReady, setClaimsReady] = useState(initialClaims.length > 0);
  const [layers, setLayers] = useState<MapLayers>({ claims: true, pasdic: true, warps: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [coordX, setCoordX] = useState(String(SERVER_SPAWN_BLOCK.x));
  const [coordZ, setCoordZ] = useState(String(SERVER_SPAWN_BLOCK.z));
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [cursorBlock, setCursorBlock] = useState<{ x: number; z: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [pasdicBusy, setPasdicBusy] = useState(false);
  const [pasdicFeedback, setPasdicFeedback] = useState<PasdicFeedback | null>(null);

  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const useTerrain = Boolean(tileBase);
  const focusNonce = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const [claimsRes, markersRes] = await Promise.all([
          fetch("/api/map/claims", { signal: AbortSignal.timeout(8_000) }),
          fetch("/api/map/markers", { signal: AbortSignal.timeout(8_000) }),
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
      } finally {
        if (!cancelled) setClaimsReady(true);
      }
    };
    void tick();
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

  const searchHits = useMemo<SearchHit[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    const factionHits: SearchHit[] = (q
      ? factions.filter(
          (faction) =>
            faction.name.toLowerCase().includes(q) || faction.tag.toLowerCase().includes(q),
        )
      : factions
    )
      .slice(0, 8)
      .map((faction) => ({ kind: "faction", faction }));

    // `/spawn` → « spawn » pour matcher le marqueur injecté « Spawn ».
    const warpQuery = q.replace(/^\//, "");
    const warpHits: SearchHit[] = (q
      ? worldMarkers.filter((marker) => {
          const name = marker.name.toLowerCase();
          return name.includes(q) || (warpQuery !== "" && name.includes(warpQuery));
        })
      : worldMarkers
    )
      .slice(0, 8)
      .map((marker) => ({
        kind: "warp",
        marker,
        key: `${marker.kind}:${marker.world}:${marker.name}:${marker.x}:${marker.z}`,
      }));

    // Sans requête : factions d'abord (liste utile), puis warps.
    // Avec requête : mélanger en gardant factions puis warps, plafond 12.
    return [...factionHits, ...warpHits].slice(0, 12);
  }, [factions, worldMarkers, searchQuery]);

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
    setSearchQuery("");
  };

  const selectWarp = (marker: MapMarker) => {
    setHighlightId(null);
    const x = Math.round(marker.x);
    const z = Math.round(marker.z);
    centerOnBlocks(x, z);
    setCoordX(String(x));
    setCoordZ(String(z));
    setSearchQuery("");
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

  const selecting = isAdmin && adminMode;

  const toggleClaimSelect = (claim: MapClaim) => {
    if (!selecting) return;
    const key = claimKeyOf(claim);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPasdicFeedback(null);
  };

  const selectHighlightedFaction = () => {
    if (highlightId == null) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const claim of worldClaims) {
        if (claim.faction.id === highlightId) next.add(claimKeyOf(claim));
      }
      return next;
    });
    setPasdicFeedback(null);
  };

  const clearSelection = () => {
    setSelectedKeys(new Set());
    setPasdicFeedback(null);
  };

  const applyPasdic = async () => {
    if (!selecting || selectedKeys.size === 0 || pasdicBusy) return;
    const chunks = claims
      .filter((claim) => selectedKeys.has(claimKeyOf(claim)))
      .map((claim) => ({ w: claim.world, x: claim.x, z: claim.z }));
    if (chunks.length === 0) {
      setPasdicFeedback({ ok: 0, refused: [], error: "Aucun claim sélectionné dans ce monde." });
      return;
    }
    setPasdicBusy(true);
    setPasdicFeedback(null);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "set_pasdic",
          payload: JSON.stringify({ chunks }),
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok || !data.id) {
        setPasdicFeedback({
          ok: 0,
          refused: [],
          error: data.error ?? "File admin indisponible (JAR à déployer ?).",
        });
        return;
      }
      let body: { status?: string; result?: string | null } | null = null;
      for (let i = 0; i < 90; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const st = await fetch(`/api/admin/action?id=${data.id}`, {
          cache: "no-store",
          credentials: "include",
        });
        body = (await st.json()) as { status?: string; result?: string | null };
        if (body.status && body.status !== "pending" && body.status !== "processing") break;
      }
      if (!body?.status || body.status === "pending" || body.status === "processing") {
        setPasdicFeedback({
          ok: 0,
          refused: [],
          error: "Le serveur n'a pas répondu à temps. Le JAR est-il déployé ?",
        });
        return;
      }
      if (body.status !== "done" || !body.result) {
        setPasdicFeedback({
          ok: 0,
          refused: [],
          error: body.result ?? "Échec PASDIC.",
        });
        return;
      }
      let parsed: {
        ok?: number;
        refused?: PasdicRefused[];
        error?: string;
      };
      try {
        parsed = JSON.parse(body.result) as {
          ok?: number;
          refused?: PasdicRefused[];
          error?: string;
        };
      } catch {
        setPasdicFeedback({ ok: 0, refused: [], error: body.result });
        return;
      }
      const refused = Array.isArray(parsed.refused) ? parsed.refused : [];
      const okCount = Number(parsed.ok) || 0;
      setPasdicFeedback({
        ok: okCount,
        refused,
        error: parsed.error,
      });
      if (okCount > 0) {
        const refusedKeys = new Set(refused.map((row) => claimKey(row.w, row.x, row.z)));
        setClaims((prev) =>
          prev.map((claim) =>
            selectedKeys.has(claimKeyOf(claim)) && !refusedKeys.has(claimKeyOf(claim))
              ? { ...claim, pasdic: true }
              : claim,
          ),
        );
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          for (const key of next) {
            if (!refusedKeys.has(key)) next.delete(key);
          }
          return next;
        });
      }
    } catch {
      setPasdicFeedback({
        ok: 0,
        refused: [],
        error: "Réseau indisponible.",
      });
    } finally {
      setPasdicBusy(false);
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
                setSearchQuery("");
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
            {!claimsReady && (
              <p className="pointer-events-none absolute left-3 top-3 z-[1000] font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                Territoires en cours de lecture…
              </p>
            )}
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
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setAdminMode((prev) => !prev);
                  setPasdicFeedback(null);
                }}
                aria-pressed={adminMode}
                className={
                  adminMode
                    ? "chip border border-ember bg-iron/90 px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.18em] text-ember-glow"
                    : "chip border border-iron-line bg-iron/90 px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.18em] text-steel hover:border-ember hover:text-bone"
                }
              >
                {adminMode ? "Admin PASDIC" : "Mode admin"}
              </button>
            )}
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
              adminSelect={selecting}
              selectedKeys={selectedKeys}
              onClaimClick={toggleClaimSelect}
            />
          ) : (
            <TerritoryCanvas
              key={activeWorld}
              claims={worldClaims}
              markers={worldMarkers}
              layers={layers}
              focus={canvasFocus}
              highlightFactionId={highlightId}
              adminSelect={selecting}
              selectedKeys={selectedKeys}
              onClaimClick={toggleClaimSelect}
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
              htmlFor="map-place-search"
              className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel"
            >
              Rechercher
            </label>
            <input
              id="map-place-search"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Faction, tag ou warp"
              autoComplete="off"
              className="border border-iron-line bg-ash-deep px-3 py-2 text-sm text-bone placeholder:text-steel/60 focus:border-ember focus:outline-none"
            />
            {searchHits.length > 0 && (
              <ul className="flex max-h-48 flex-col overflow-y-auto border border-iron-line bg-ash-deep">
                {searchHits.map((hit) =>
                  hit.kind === "faction" ? (
                    <li key={`f-${hit.faction.id}`}>
                      <button
                        type="button"
                        onClick={() => selectFaction(hit.faction)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-bone transition-colors hover:bg-iron-light"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0"
                          style={{ backgroundColor: factionStroke(hit.faction.id) }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{hit.faction.name}</span>
                        <span className="ml-auto font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                          [{hit.faction.tag}]
                        </span>
                      </button>
                    </li>
                  ) : (
                    <li key={hit.key}>
                      <button
                        type="button"
                        onClick={() => selectWarp(hit.marker)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-bone transition-colors hover:bg-iron-light"
                      >
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rotate-45 ${
                            hit.marker.kind === "event" ? "bg-ember-glow" : "bg-gold"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate">{hit.marker.name}</span>
                        <span className="ml-auto font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                          {hit.marker.kind === "event" ? "Event" : "Warp"}
                        </span>
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}
            {searchQuery.trim() !== "" && searchHits.length === 0 && (
              <p className="text-xs text-steel">
                Aucune faction ni warp ne répond à ce nom.
              </p>
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

          {isAdmin && adminMode && (
            <div className="flex flex-col gap-2 border border-ember/60 bg-ash-deep p-3">
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
                PASDIC admin
              </span>
              <p className="text-xs leading-relaxed text-steel">
                Clique les claims à marquer. Les chunks avec coffres / conteneurs
                ou spawners sont refusés — inspecte-les en jeu.
              </p>
              <p className="font-tech text-[10px] uppercase tracking-[0.18em] text-bone">
                {selectedKeys.size} claim{selectedKeys.size > 1 ? "s" : ""}{" "}
                sélectionné{selectedKeys.size > 1 ? "s" : ""}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={selectHighlightedFaction}
                  disabled={highlightId == null}
                  className="pressable border border-iron-line px-3 py-2 font-tech text-[10px] uppercase tracking-[0.18em] text-steel hover:border-ember hover:text-bone disabled:opacity-40"
                >
                  Sélectionner la faction
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={selectedKeys.size === 0}
                  className="pressable border border-iron-line px-3 py-2 font-tech text-[10px] uppercase tracking-[0.18em] text-steel hover:border-ember hover:text-bone disabled:opacity-40"
                >
                  Vider la sélection
                </button>
                <button
                  type="button"
                  onClick={() => void applyPasdic()}
                  disabled={selectedKeys.size === 0 || pasdicBusy}
                  className="pressable border border-ember bg-iron px-3 py-2 font-tech text-[10px] uppercase tracking-[0.22em] text-ember-glow hover:text-bone disabled:opacity-40"
                >
                  {pasdicBusy ? "Application…" : "Définir PASDIC"}
                </button>
              </div>
              {pasdicFeedback && (
                <div className="flex flex-col gap-1.5 text-xs text-steel">
                  {pasdicFeedback.error && (
                    <p className="text-ember-glow">{pasdicFeedback.error}</p>
                  )}
                  <p className="text-bone">
                    {pasdicFeedback.ok} ok
                    {pasdicFeedback.refused.length > 0
                      ? ` · ${pasdicFeedback.refused.length} refusé${
                          pasdicFeedback.refused.length > 1 ? "s" : ""
                        } (stockage / spawners)`
                      : ""}
                  </p>
                  {pasdicFeedback.refused.length > 0 && (
                    <ul className="max-h-36 overflow-y-auto border border-iron-line bg-iron px-2 py-1.5 font-tech text-[10px] uppercase tracking-[0.12em] text-steel">
                      {pasdicFeedback.refused.map((row) => (
                        <li key={`${row.w}:${row.x}:${row.z}`}>
                          {row.w} {row.x},{row.z} —{" "}
                          {PASDIC_REASON_LABEL[row.reason] ?? row.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

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
                ? "Tuiles Squaremap + territoires Cantale (sans joueurs live). Glisser pour déplacer, molette pour zoomer. Spawn par défaut : "
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
