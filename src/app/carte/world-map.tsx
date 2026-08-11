"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  MAP_COLORS,
  SERVER_SPAWN_BLOCK,
  chunkToBlock,
  factionFill,
  factionStroke,
  type MapClaim,
  type MapMarker,
} from "@/lib/map-utils";
import {
  DEFAULT_SQUAREMAP_ZOOM,
  blockToLatLng,
  latLngToBlock,
  squaremapSettingsUrl,
  squaremapTileUrlTemplate,
  type SquaremapWorldSettings,
} from "@/lib/map-squaremap";
import type { MapFocus, MapLayers } from "./territory-canvas";

type Props = {
  claims: MapClaim[];
  markers: MapMarker[];
  layers: MapLayers;
  focus: MapFocus | null;
  highlightFactionId: number | null;
  /** Dossier tuiles Squaremap (ex. minecraft_overworld). */
  squaremapWorld: string;
  /** Base `/map-provider` ou origine HTTPS. */
  tileBase: string;
  /** Coords bloc affichées sous le curseur. */
  onCursorBlock?: (block: { x: number; z: number } | null) => void;
  className?: string;
};

function parseSettings(raw: unknown): SquaremapWorldSettings {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const spawn = obj.spawn && typeof obj.spawn === "object" ? (obj.spawn as Record<string, unknown>) : {};
  const zoom = obj.zoom && typeof obj.zoom === "object" ? (obj.zoom as Record<string, unknown>) : {};
  const sx = Number(spawn.x);
  const sz = Number(spawn.z);
  return {
    spawn: {
      x: Number.isFinite(sx) ? sx : SERVER_SPAWN_BLOCK.x,
      z: Number.isFinite(sz) ? sz : SERVER_SPAWN_BLOCK.z,
    },
    zoom: {
      def: Number.isFinite(Number(zoom.def)) ? Number(zoom.def) : DEFAULT_SQUAREMAP_ZOOM.def,
      max: Number.isFinite(Number(zoom.max)) ? Number(zoom.max) : DEFAULT_SQUAREMAP_ZOOM.max,
      extra: Number.isFinite(Number(zoom.extra)) ? Number(zoom.extra) : DEFAULT_SQUAREMAP_ZOOM.extra,
    },
  };
}

/**
 * Carte Leaflet : tuiles Squaremap (via proxy) + overlays Cantale
 * (claims, PASDIC, warps). Centre par défaut = /spawn (-67, -144).
 */
export function WorldMap({
  claims,
  markers,
  layers,
  focus,
  highlightFactionId,
  squaremapWorld,
  tileBase,
  onCursorBlock,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const overlaysRef = useRef<L.LayerGroup | null>(null);
  const maxZoomRef = useRef<number>(DEFAULT_SQUAREMAP_ZOOM.max);
  const settingsRef = useRef<SquaremapWorldSettings>({
    spawn: { x: SERVER_SPAWN_BLOCK.x, z: SERVER_SPAWN_BLOCK.z },
    zoom: {
      def: DEFAULT_SQUAREMAP_ZOOM.def,
      max: DEFAULT_SQUAREMAP_ZOOM.max,
      extra: DEFAULT_SQUAREMAP_ZOOM.extra,
    },
  });
  const onCursorRef = useRef(onCursorBlock);
  useEffect(() => {
    onCursorRef.current = onCursorBlock;
  }, [onCursorBlock]);

  // Montage carte (une fois) — centre spawn hardcodé, jamais 0,0.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const maxZoom = DEFAULT_SQUAREMAP_ZOOM.max;
    maxZoomRef.current = maxZoom;
    const center = blockToLatLng(SERVER_SPAWN_BLOCK.x, SERVER_SPAWN_BLOCK.z, maxZoom);

    const map = L.map(el, {
      crs: L.CRS.Simple,
      center,
      zoom: DEFAULT_SQUAREMAP_ZOOM.def,
      minZoom: 0,
      maxZoom: DEFAULT_SQUAREMAP_ZOOM.max + DEFAULT_SQUAREMAP_ZOOM.extra,
      attributionControl: false,
      preferCanvas: true,
      zoomControl: true,
    });

    const overlays = L.layerGroup().addTo(map);
    overlaysRef.current = overlays;
    mapRef.current = map;

    map.on("mousemove", (event: L.LeafletMouseEvent) => {
      const block = latLngToBlock(event.latlng.lat, event.latlng.lng, maxZoomRef.current);
      onCursorRef.current?.({ x: Math.floor(block.x), z: Math.floor(block.z) });
    });
    map.on("mouseout", () => onCursorRef.current?.(null));

    const onFs = () => {
      requestAnimationFrame(() => map.invalidateSize());
    };
    document.addEventListener("fullscreenchange", onFs);

    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
      overlaysRef.current = null;
    };
  }, []);

  // Monde Squaremap / settings → tuiles. Recentrage spawn une seule fois (pas après un focus).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileBase) return;
    let cancelled = false;

    const spawnFor = (settings: SquaremapWorldSettings) =>
      squaremapWorld === "minecraft_overworld" ? SERVER_SPAWN_BLOCK : settings.spawn;

    const mountTiles = (settings: SquaremapWorldSettings, centerCamera: boolean) => {
      if (cancelled) return;
      settingsRef.current = settings;
      maxZoomRef.current = settings.zoom.max;
      map.setMinZoom(0);
      map.setMaxZoom(settings.zoom.max + settings.zoom.extra);

      if (tileRef.current) {
        map.removeLayer(tileRef.current);
        tileRef.current = null;
      }
      const layer = L.tileLayer(squaremapTileUrlTemplate(tileBase, squaremapWorld), {
        tileSize: 512,
        minNativeZoom: 0,
        maxNativeZoom: settings.zoom.max,
        minZoom: 0,
        maxZoom: settings.zoom.max + settings.zoom.extra,
        noWrap: true,
        errorTileUrl: `${tileBase}/images/clear.png`,
      });
      layer.addTo(map);
      tileRef.current = layer;

      if (centerCamera) {
        const spawn = spawnFor(settings);
        map.setView(
          blockToLatLng(spawn.x, spawn.z, settings.zoom.max),
          settings.zoom.def,
          { animate: false },
        );
      }
      map.invalidateSize();
    };

    mountTiles(
      { spawn: { ...SERVER_SPAWN_BLOCK }, zoom: { ...DEFAULT_SQUAREMAP_ZOOM } },
      true,
    );

    fetch(squaremapSettingsUrl(tileBase, squaremapWorld))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json || cancelled) return;
        // Met à jour zoom/tuiles sans écraser un focus utilisateur.
        mountTiles(parseSettings(json), false);
      })
      .catch(() => {
        /* défauts déjà en place */
      });

    return () => {
      cancelled = true;
    };
  }, [squaremapWorld, tileBase]);

  // Overlays claims / markers.
  useEffect(() => {
    const map = mapRef.current;
    const group = overlaysRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const maxZoom = maxZoomRef.current;
    const renderer = map.options.renderer;

    for (const claim of claims) {
      const showClaim = layers.claims;
      const showPasdic = layers.pasdic && claim.pasdic;
      if (!showClaim && !showPasdic) continue;

      const x0 = chunkToBlock(claim.x);
      const z0 = chunkToBlock(claim.z);
      const x1 = x0 + 16;
      const z1 = z0 + 16;
      const bounds = L.latLngBounds(
        blockToLatLng(x0, z0, maxZoom),
        blockToLatLng(x1, z1, maxZoom),
      );
      const highlighted = highlightFactionId === claim.faction.id;

      if (showClaim) {
        L.rectangle(bounds, {
          renderer,
          color: highlighted ? MAP_COLORS.bone : factionStroke(claim.faction.id),
          weight: highlighted ? 2.5 : 1,
          fillColor: factionFill(claim.faction.id, highlighted ? 0.72 : 0.45),
          fillOpacity: 1,
          interactive: true,
        })
          .bindTooltip(
            `${claim.faction.name} [${claim.faction.tag}]${claim.pasdic ? " · PASDIC" : ""}`,
            { sticky: true, direction: "top", opacity: 0.95 },
          )
          .addTo(group);
      }

      if (showPasdic) {
        const pasdicRect = L.rectangle(bounds, {
          renderer,
          color: MAP_COLORS.gold,
          weight: 2,
          dashArray: "4 3",
          fillColor: MAP_COLORS.gold,
          fillOpacity: showClaim ? 0 : 0.22,
          interactive: !showClaim,
        });
        if (!showClaim) {
          pasdicRect.bindTooltip(
            `${claim.faction.name} [${claim.faction.tag}] · PASDIC`,
            { sticky: true, direction: "top", opacity: 0.95 },
          );
        }
        pasdicRect.addTo(group);
      }
    }

    if (layers.warps) {
      for (const marker of markers) {
        const latlng = blockToLatLng(marker.x, marker.z, maxZoom);
        const event = marker.kind === "event";
        const color = event ? MAP_COLORS.emberGlow : MAP_COLORS.gold;
        L.circleMarker(latlng, {
          renderer,
          radius: event ? 7 : 5,
          color: event ? MAP_COLORS.ember : color,
          weight: event ? 2 : 1.5,
          fillColor: color,
          fillOpacity: 0.95,
        })
          .bindTooltip(`${marker.name}${event ? " (événement)" : ""}`, {
            sticky: true,
            direction: "top",
            opacity: 0.95,
          })
          .addTo(group);
      }

      // Repère spawn overworld (pas en base warps).
      if (squaremapWorld === "minecraft_overworld") {
        const spawnLl = blockToLatLng(SERVER_SPAWN_BLOCK.x, SERVER_SPAWN_BLOCK.z, maxZoom);
        L.circleMarker(spawnLl, {
          renderer,
          radius: 6,
          color: MAP_COLORS.ember,
          weight: 2,
          fillColor: MAP_COLORS.bone,
          fillOpacity: 1,
        })
          .bindTooltip(`Spawn (${SERVER_SPAWN_BLOCK.x} · ${SERVER_SPAWN_BLOCK.z})`, {
            sticky: true,
            direction: "top",
            opacity: 0.95,
          })
          .addTo(group);
      }
    }
  }, [claims, markers, layers, highlightFactionId, squaremapWorld]);

  // Focus externe (faction / coords) — coords = blocs.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const center = blockToLatLng(focus.x, focus.z, maxZoomRef.current);
    map.setView(center, Math.max(map.getZoom(), settingsRef.current.zoom.def), {
      animate: true,
    });
  }, [focus]);

  return (
    <div
      ref={containerRef}
      className={`cantale-world-map h-full w-full ${className ?? ""}`}
      role="application"
      aria-label={`Carte du monde. Centre par défaut : spawn ${SERVER_SPAWN_BLOCK.x} · ${SERVER_SPAWN_BLOCK.z}.`}
    />
  );
}
