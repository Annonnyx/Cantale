"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import {
  MAP_COLORS,
  SERVER_SPAWN_BLOCK,
  SERVER_SPAWN_CHUNK,
  chunkToBlock,
  claimKeyOf,
  factionFill,
  factionStroke,
  type MapClaim,
  type MapFactionRef,
  type MapMarker,
} from "@/lib/map-utils";

export type MapLayers = {
  claims: boolean;
  pasdic: boolean;
  warps: boolean;
};

/** Demande de centrage émise par la légende ou la recherche (coords chunk). */
export type MapFocus = { x: number; z: number; nonce: number };

type Camera = { x: number; z: number; scale: number };

type HoverTarget =
  | { kind: "claim"; claim: MapClaim }
  | { kind: "marker"; marker: MapMarker };

const SCALE_MIN = 1.5;
const SCALE_MAX = 160;
/**
 * Zoom par défaut : ~12 px / chunk → ~±500 blocs visibles sur 800 px de large.
 * Assez large pour le spawn, assez serré pour lire les claims proches.
 */
const DEFAULT_SCALE = 12;
const MARKER_HIT_RADIUS = 10;
const ZOOM_STEP = 1.4;

function clampScale(scale: number): number {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
}

/** Pas de grille « propre » : puissances de 2 garantissant ≥ 90 px entre lignes. */
function gridStep(scale: number): number {
  let step = 1;
  while (step * scale < 90) step *= 2;
  return step;
}

/** Couleur hexa + canal alpha, pour le canvas (#RRGGBBAA). */
function hexA(hex: string, alpha: number): string {
  const byte = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `${hex}${byte.toString(16).padStart(2, "0")}`;
}

/**
 * Carte schématique des territoires, rendue sur <canvas> : plusieurs milliers
 * de chunks restent fluides (un redraw = quelques boucles de rect), là où un
 * DOM SVG par chunk s'effondrerait. Redraw minimal : uniquement sur changement
 * d'état (pan, zoom, survol, données), via requestAnimationFrame dédoublonné,
 * avec prise en compte du devicePixelRatio.
 */
export function TerritoryCanvas({
  claims,
  markers,
  layers,
  focus,
  highlightFactionId,
  adminSelect = false,
  selectedKeys,
  onClaimClick,
}: {
  claims: MapClaim[];
  markers: MapMarker[];
  layers: MapLayers;
  focus: MapFocus | null;
  highlightFactionId: number | null;
  adminSelect?: boolean;
  selectedKeys?: ReadonlySet<string>;
  onClaimClick?: (claim: MapClaim) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camRef = useRef<Camera>({
    x: SERVER_SPAWN_CHUNK.x,
    z: SERVER_SPAWN_CHUNK.z,
    scale: DEFAULT_SCALE,
  });
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const rafRef = useRef(0);
  const animRef = useRef(0);
  const dragRef = useRef<{
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const pinchRef = useRef<{ d: number; cx: number; cy: number } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const hoverRef = useRef<HoverTarget | null>(null);
  const centeredRef = useRef(false);
  const [hover, setHover] = useState<{ target: HoverTarget; left: number; top: number } | null>(null);

  const grouped = useMemo(() => {
    const byId = new Map<number, { faction: MapFactionRef; chunks: MapClaim[] }>();
    for (const claim of claims) {
      const entry = byId.get(claim.faction.id);
      if (entry) entry.chunks.push(claim);
      else byId.set(claim.faction.id, { faction: claim.faction, chunks: [claim] });
    }
    return [...byId.values()];
  }, [claims]);

  const pasdicClaims = useMemo(() => claims.filter((claim) => claim.pasdic), [claims]);

  const claimIndex = useMemo(() => {
    const index = new Map<string, MapClaim>();
    for (const claim of claims) index.set(`${claim.x},${claim.z}`, claim);
    return index;
  }, [claims]);

  // Valeurs fraîches pour les écouteurs natifs montés une seule fois.
  const latestRef = useRef({
    markers,
    layers,
    claimIndex,
    adminSelect,
    selectedKeys: selectedKeys ?? new Set<string>(),
    onClaimClick,
  });
  useEffect(() => {
    latestRef.current = {
      markers,
      layers,
      claimIndex,
      adminSelect,
      selectedKeys: selectedKeys ?? new Set<string>(),
      onClaimClick,
    };
  });

  const drawRef = useRef<() => void>(() => {});
  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== 0) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      drawRef.current();
    });
  }, []);

  /**
   * Vue par défaut stable : toujours le spawn serveur (`/spawn`, blocs
   * SERVER_SPAWN_BLOCK) au centre, zoom fixe. Évite de atterrir au milieu de
   * nulle part quand les claims sont épars (ancien fit-to-bounds).
   */
  const resetView = useCallback(() => {
    const cam = camRef.current;
    cam.x = SERVER_SPAWN_CHUNK.x;
    cam.z = SERVER_SPAWN_CHUNK.z;
    cam.scale = DEFAULT_SCALE;
    scheduleDraw();
  }, [scheduleDraw]);

  const resetRef = useRef(resetView);
  useEffect(() => {
    resetRef.current = resetView;
  }, [resetView]);

  /* ——— Rendu ——— */
  useEffect(() => {
    drawRef.current = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const { w, h, dpr } = sizeRef.current;
      if (w <= 0 || h <= 0) return;
      const cam = camRef.current;
      const scale = cam.scale;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = MAP_COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      const sx = (chunkX: number) => (chunkX - cam.x) * scale + w / 2;
      const sz = (chunkZ: number) => (chunkZ - cam.z) * scale + h / 2;
      const left = cam.x - w / 2 / scale;
      const right = cam.x + w / 2 / scale;
      const top = cam.z - h / 2 / scale;
      const bottom = cam.z + h / 2 / scale;
      const inView = (cx: number, cz: number) =>
        cx + 1 >= left && cx <= right && cz + 1 >= top && cz <= bottom;

      // Grille alignée sur les chunks, graduée en coordonnées bloc.
      const step = gridStep(scale);
      ctx.lineWidth = 1;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textBaseline = "top";
      for (let gx = Math.ceil(left / step) * step; gx <= right; gx += step) {
        const major = gx % 16 === 0;
        const x = sx(gx) + 0.5;
        ctx.strokeStyle = hexA(MAP_COLORS.grid, major ? 0.9 : 0.5);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.fillStyle = hexA(MAP_COLORS.axis, major ? 0.9 : 0.55);
        ctx.fillText(String(chunkToBlock(gx)), x + 4, 4);
      }
      for (let gz = Math.ceil(top / step) * step; gz <= bottom; gz += step) {
        const major = gz % 16 === 0;
        const z = sz(gz) + 0.5;
        ctx.strokeStyle = hexA(MAP_COLORS.grid, major ? 0.9 : 0.5);
        ctx.beginPath();
        ctx.moveTo(0, z);
        ctx.lineTo(w, z);
        ctx.stroke();
        ctx.fillStyle = hexA(MAP_COLORS.axis, major ? 0.9 : 0.55);
        ctx.fillText(String(chunkToBlock(gz)), 4, z + 4);
      }

      // Origine du monde (chunk 0,0).
      const ox = sx(0);
      const oz = sz(0);
      if (ox >= -24 && ox <= w + 24 && oz >= -24 && oz <= h + 24) {
        ctx.strokeStyle = hexA(MAP_COLORS.emberGlow, 0.85);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox - 6, oz);
        ctx.lineTo(ox + 6, oz);
        ctx.moveTo(ox, oz - 6);
        ctx.lineTo(ox, oz + 6);
        ctx.stroke();
        ctx.fillStyle = hexA(MAP_COLORS.axis, 0.9);
        ctx.fillText("0 · 0", ox + 8, oz + 6);
      }

      // Territoires : remplissage groupé par faction, puis contours.
      if (layers.claims) {
        const gap = scale > 6 ? 1 : 0;
        for (const group of grouped) {
          ctx.fillStyle = factionFill(group.faction.id);
          ctx.beginPath();
          for (const claim of group.chunks) {
            if (!inView(claim.x, claim.z)) continue;
            ctx.rect(sx(claim.x) + gap / 2, sz(claim.z) + gap / 2, scale - gap, scale - gap);
          }
          ctx.fill();
        }
        ctx.lineWidth = 1;
        for (const group of grouped) {
          ctx.strokeStyle = factionStroke(group.faction.id);
          ctx.beginPath();
          for (const claim of group.chunks) {
            if (!inView(claim.x, claim.z)) continue;
            ctx.rect(sx(claim.x) + 0.5, sz(claim.z) + 0.5, scale - 1, scale - 1);
          }
          ctx.stroke();
        }
      }

      // Faction mise en avant (légende / recherche).
      if (highlightFactionId !== null && layers.claims) {
        const group = grouped.find((g) => g.faction.id === highlightFactionId);
        if (group) {
          ctx.strokeStyle = MAP_COLORS.bone;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (const claim of group.chunks) {
            if (!inView(claim.x, claim.z)) continue;
            ctx.rect(sx(claim.x) - 1, sz(claim.z) - 1, scale + 2, scale + 2);
          }
          ctx.stroke();
        }
      }

      const selected = latestRef.current.selectedKeys;
      if (selected.size > 0 && layers.claims && latestRef.current.adminSelect) {
        ctx.strokeStyle = MAP_COLORS.emberGlow;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (const claim of claims) {
          if (!selected.has(claimKeyOf(claim)) || !inView(claim.x, claim.z)) continue;
          ctx.rect(sx(claim.x) - 1.5, sz(claim.z) - 1.5, scale + 3, scale + 3);
        }
        ctx.stroke();
      }

      // Zones PASDIC : hachures diagonales et bordure or, couche distincte.
      if (layers.pasdic) {
        for (const claim of pasdicClaims) {
          if (!inView(claim.x, claim.z)) continue;
          const px = sx(claim.x);
          const pz = sz(claim.z);
          ctx.save();
          ctx.beginPath();
          ctx.rect(px, pz, scale, scale);
          ctx.clip();
          ctx.strokeStyle = hexA(MAP_COLORS.gold, 0.4);
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let d = -scale; d <= scale * 2; d += 5) {
            ctx.moveTo(px + d, pz);
            ctx.lineTo(px + d + scale, pz + scale);
          }
          ctx.stroke();
          ctx.restore();
          ctx.strokeStyle = MAP_COLORS.gold;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 0.75, pz + 0.75, scale - 1.5, scale - 1.5);
        }
      }

      // Repères : warps publics (or) et warps d'événement (braise cerclée).
      if (layers.warps) {
        const r = 5;
        for (const marker of markers) {
          const mx = sx(marker.x / 16);
          const mz = sz(marker.z / 16);
          if (mx < -40 || mx > w + 40 || mz < -40 || mz > h + 40) continue;
          const color = marker.kind === "event" ? MAP_COLORS.emberGlow : MAP_COLORS.gold;
          ctx.beginPath();
          ctx.moveTo(mx, mz - r);
          ctx.lineTo(mx + r, mz);
          ctx.lineTo(mx, mz + r);
          ctx.lineTo(mx - r, mz);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = MAP_COLORS.bg;
          ctx.lineWidth = 1;
          ctx.stroke();
          if (marker.kind === "event") {
            ctx.beginPath();
            ctx.arc(mx, mz, r + 3, 0, Math.PI * 2);
            ctx.strokeStyle = hexA(MAP_COLORS.emberGlow, 0.6);
            ctx.stroke();
          }
          if (scale >= 7) {
            ctx.font = "10px system-ui, sans-serif";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 3;
            ctx.strokeStyle = hexA(MAP_COLORS.bg, 0.85);
            ctx.strokeText(marker.name, mx + r + 5, mz);
            ctx.fillStyle = MAP_COLORS.bone;
            ctx.fillText(marker.name, mx + r + 5, mz);
          }
        }
      }

      // Équerres sur le chunk ciblé par la recherche / la légende.
      if (focus) {
        const fx = sx(Math.floor(focus.x));
        const fz = sz(Math.floor(focus.z));
        if (fx > -scale && fx < w + scale && fz > -scale && fz < h + scale) {
          const b = Math.min(7, scale / 2.5);
          const x2 = fx + scale;
          const z2 = fz + scale;
          ctx.strokeStyle = MAP_COLORS.emberGlow;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fx - 2, fz - 2 + b);
          ctx.lineTo(fx - 2, fz - 2);
          ctx.lineTo(fx - 2 + b, fz - 2);
          ctx.moveTo(x2 + 2 - b, fz - 2);
          ctx.lineTo(x2 + 2, fz - 2);
          ctx.lineTo(x2 + 2, fz - 2 + b);
          ctx.moveTo(x2 + 2, z2 + 2 - b);
          ctx.lineTo(x2 + 2, z2 + 2);
          ctx.lineTo(x2 + 2 - b, z2 + 2);
          ctx.moveTo(fx - 2 + b, z2 + 2);
          ctx.lineTo(fx - 2, z2 + 2);
          ctx.lineTo(fx - 2, z2 + 2 - b);
          ctx.stroke();
        }
      }

      // Survol.
      const hovered = hoverRef.current;
      if (hovered?.kind === "claim") {
        ctx.strokeStyle = MAP_COLORS.bone;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx(hovered.claim.x) + 1, sz(hovered.claim.z) + 1, scale - 2, scale - 2);
      } else if (hovered?.kind === "marker") {
        ctx.beginPath();
        ctx.arc(sx(hovered.marker.x / 16), sz(hovered.marker.z / 16), 9, 0, Math.PI * 2);
        ctx.strokeStyle = MAP_COLORS.bone;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };
    scheduleDraw();
  }, [grouped, pasdicClaims, claims, markers, layers, highlightFactionId, focus, selectedKeys, scheduleDraw]);

  /* ——— Interactions souris / tactile (écouteurs natifs, montés une fois) ——— */
  const zoomRef = useRef<(clientX: number, clientY: number, factor: number) => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      if (!centeredRef.current) {
        centeredRef.current = true;
        resetRef.current();
      }
      scheduleDraw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const zoomAt = (clientX: number, clientY: number, factor: number) => {
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const cam = camRef.current;
      const next = clampScale(cam.scale * factor);
      if (next === cam.scale) return;
      // Le chunk sous le curseur reste fixe pendant le zoom.
      cam.x += (px - rect.width / 2) * (1 / cam.scale - 1 / next);
      cam.z += (py - rect.height / 2) * (1 / cam.scale - 1 / next);
      cam.scale = next;
      scheduleDraw();
    };
    zoomRef.current = zoomAt;

    const computeHover = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const cam = camRef.current;
      const current = latestRef.current;

      let target: HoverTarget | null = null;
      if (current.layers.warps) {
        for (const marker of current.markers) {
          const mx = (marker.x / 16 - cam.x) * cam.scale + rect.width / 2;
          const mz = (marker.z / 16 - cam.z) * cam.scale + rect.height / 2;
          if (Math.hypot(mx - px, mz - py) <= MARKER_HIT_RADIUS) {
            target = { kind: "marker", marker };
            break;
          }
        }
      }
      if (!target && current.layers.claims) {
        const cx = Math.floor((px - rect.width / 2) / cam.scale + cam.x);
        const cz = Math.floor((py - rect.height / 2) / cam.scale + cam.z);
        const claim = current.claimIndex.get(`${cx},${cz}`);
        if (claim) target = { kind: "claim", claim };
      }

      hoverRef.current = target;
      if (!target) {
        setHover(null);
      } else {
        setHover({
          target,
          left: px > rect.width - 240 ? px - 234 : px + 14,
          top: py > rect.height - 120 ? py - 110 : py + 14,
        });
      }
      scheduleDraw();
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0015));
    };

    const onPointerDown = (event: PointerEvent) => {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      canvas.setPointerCapture(event.pointerId);
      // Un drag déplace la carte sous le curseur : l'infobulle deviendrait fausse.
      hoverRef.current = null;
      setHover(null);
      if (pointersRef.current.size === 1) {
        dragRef.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
        };
        canvas.style.cursor = "grabbing";
      } else if (pointersRef.current.size === 2) {
        dragRef.current = null;
        const [a, b] = [...pointersRef.current.values()];
        pinchRef.current = {
          d: Math.hypot(a.x - b.x, a.y - b.y),
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
        };
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) {
        computeHover(event.clientX, event.clientY);
        return;
      }
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pinchRef.current && pointersRef.current.size === 2) {
        const [a, b] = [...pointersRef.current.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        const prev = pinchRef.current;
        if (prev.d > 0 && d > 0) zoomAt(cx, cy, d / prev.d);
        const cam = camRef.current;
        cam.x -= (cx - prev.cx) / cam.scale;
        cam.z -= (cy - prev.cy) / cam.scale;
        pinchRef.current = { d, cx, cy };
        scheduleDraw();
        return;
      }

      const drag = dragRef.current;
      if (drag && drag.id === event.pointerId) {
        const cam = camRef.current;
        cam.x -= (event.clientX - drag.x) / cam.scale;
        cam.z -= (event.clientY - drag.y) / cam.scale;
        drag.x = event.clientX;
        drag.y = event.clientY;
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) {
          drag.moved = true;
        }
        scheduleDraw();
      }
    };

    const endPointer = (event: PointerEvent) => {
      const drag = dragRef.current;
      const wasClick =
        drag?.id === event.pointerId && !drag.moved && pointersRef.current.size <= 1;
      const clickX = event.clientX;
      const clickY = event.clientY;
      pointersRef.current.delete(event.pointerId);
      if (pinchRef.current && pointersRef.current.size < 2) pinchRef.current = null;
      if (dragRef.current?.id === event.pointerId) dragRef.current = null;
      if (pointersRef.current.size === 1) {
        const [[id, pos]] = [...pointersRef.current.entries()];
        dragRef.current = {
          id,
          x: pos.x,
          y: pos.y,
          startX: pos.x,
          startY: pos.y,
          moved: false,
        };
      }
      if (pointersRef.current.size === 0) canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

      if (wasClick && latestRef.current.adminSelect) {
        const current = latestRef.current;
        const rect = canvas.getBoundingClientRect();
        const px = clickX - rect.left;
        const py = clickY - rect.top;
        const cam = camRef.current;
        const cx = Math.floor((px - rect.width / 2) / cam.scale + cam.x);
        const cz = Math.floor((py - rect.height / 2) / cam.scale + cam.z);
        const claim = current.claimIndex.get(`${cx},${cz}`);
        if (claim) current.onClaimClick?.(claim);
      }
    };

    const onPointerLeave = () => {
      hoverRef.current = null;
      setHover(null);
      scheduleDraw();
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      observer.disconnect();
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [scheduleDraw]);

  /* ——— Centrage animé (recherche / légende) ——— */
  useEffect(() => {
    if (!focus) return;
    const cam = camRef.current;
    const targetScale = clampScale(Math.max(cam.scale, 26));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      cam.x = focus.x;
      cam.z = focus.z;
      cam.scale = targetScale;
      scheduleDraw();
      return;
    }
    const from = { ...cam };
    const start = performance.now();
    const duration = 320;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      cam.x = from.x + (focus.x - from.x) * eased;
      cam.z = from.z + (focus.z - from.z) * eased;
      cam.scale = from.scale + (targetScale - from.scale) * eased;
      scheduleDraw();
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [focus, scheduleDraw]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(animRef.current);
    },
    [],
  );

  const zoomBy = useCallback((factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    zoomRef.current(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const cam = camRef.current;
    const { w, h } = sizeRef.current;
    const panX = w / 5 / cam.scale;
    const panZ = h / 5 / cam.scale;
    switch (event.key) {
      case "ArrowLeft":
        cam.x -= panX;
        break;
      case "ArrowRight":
        cam.x += panX;
        break;
      case "ArrowUp":
        cam.z -= panZ;
        break;
      case "ArrowDown":
        cam.z += panZ;
        break;
      case "+":
      case "=":
        zoomBy(1.25);
        break;
      case "-":
      case "_":
        zoomBy(1 / 1.25);
        break;
      case "0":
        resetRef.current();
        break;
      default:
        return;
    }
    event.preventDefault();
    scheduleDraw();
  };

  const srStatus = useMemo(() => {
    if (!hover) return "Aucun élément survolé.";
    if (hover.target.kind === "claim") {
      const { claim } = hover.target;
      const base = `Chunk ${claim.x} ${claim.z}, faction ${claim.faction.name}`;
      return claim.pasdic ? `${base}, zone PASDIC protégée.` : `${base}.`;
    }
    const { marker } = hover.target;
    return `${marker.kind === "event" ? "Warp d'événement" : "Warp public"} ${marker.name}.`;
  }, [hover]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        role="img"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          // Focus clavier sans scrollIntoView natif (évite le saut de page).
          event.currentTarget.focus({ preventScroll: true });
        }}
        aria-label={`Carte interactive des territoires. Glisser pour déplacer, molette pour zoomer. Au clavier : flèches pour déplacer, touches plus et moins pour zoomer, zéro pour recentrer sur le spawn (${SERVER_SPAWN_BLOCK.x} · ${SERVER_SPAWN_BLOCK.z}).`}
        className="block h-full w-full cursor-grab touch-none"
      />

      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <MapButton label="Zoom avant" onClick={() => zoomBy(ZOOM_STEP)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M7 1v12M1 7h12" />
          </svg>
        </MapButton>
        <MapButton label="Zoom arrière" onClick={() => zoomBy(1 / ZOOM_STEP)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M1 7h12" />
          </svg>
        </MapButton>
        <MapButton
          label={`Recentrer sur le spawn (${SERVER_SPAWN_BLOCK.x} · ${SERVER_SPAWN_BLOCK.z})`}
          onClick={() => resetRef.current()}
        >          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
          </svg>
        </MapButton>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-60 border border-iron-line bg-iron/95 px-3 py-2"
          style={{ left: hover.left, top: hover.top }}
        >
          {hover.target.kind === "claim" ? (
            <div className="flex flex-col gap-1">
              <span className="font-display text-sm font-semibold text-bone">
                {hover.target.claim.faction.name}{" "}
                <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                  [{hover.target.claim.faction.tag}]
                </span>
              </span>
              <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                Chunk {hover.target.claim.x} · {hover.target.claim.z} — blocs{" "}
                {chunkToBlock(hover.target.claim.x)} · {chunkToBlock(hover.target.claim.z)}
              </span>
              {hover.target.claim.pasdic && (
                <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-gold">
                  Zone PASDIC — territoire protégé
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="font-display text-sm font-semibold text-bone">
                {hover.target.marker.name}
              </span>
              <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                {hover.target.marker.kind === "event" ? "Warp d’événement" : "Warp public"} —{" "}
                {Math.round(hover.target.marker.x)} · {Math.round(hover.target.marker.y)} ·{" "}
                {Math.round(hover.target.marker.z)}
              </span>
            </div>
          )}
        </div>
      )}

      <span aria-live="polite" className="sr-only">
        {srStatus}
      </span>
    </div>
  );
}

function MapButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center border border-iron-line bg-iron/90 text-steel transition-colors hover:border-ember hover:text-bone"
    >
      {children}
    </button>
  );
}
