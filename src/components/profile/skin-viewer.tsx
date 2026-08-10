"use client";

import { useEffect, useRef, useState } from "react";

const VIEWER_WIDTH = 300;
const VIEWER_HEIGHT = 420;

/**
 * Rendu 3D du skin Minecraft (skinview3d, animation idle + rotation douce).
 * Le skin provient de Crafatar (CORS ouvert). Si WebGL est indisponible
 * ou si le chargement échoue, repli sur l'avatar 2D Crafatar.
 */
export function SkinViewer({ uuid, username }: { uuid: string; username: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let viewer: import("skinview3d").SkinViewer | null = null;

    const init = async () => {
      try {
        const skinview3d = await import("skinview3d");
        if (cancelled || !canvasRef.current) return;

        viewer = new skinview3d.SkinViewer({
          canvas,
          width: VIEWER_WIDTH,
          height: VIEWER_HEIGHT,
        });
        viewer.camera.position.set(0, 10, 46);
        viewer.animation = new skinview3d.IdleAnimation();
        viewer.autoRotate = true;
        viewer.autoRotateSpeed = 0.6;
        viewer.zoom = 0.9;
        await viewer.loadSkin(`https://crafatar.com/skins/${uuid}?overlay`, {
          model: "auto-detect",
        });
      } catch {
        if (!cancelled) setFallback(true);
      }
    };

    init();
    return () => {
      cancelled = true;
      viewer?.dispose();
    };
  }, [uuid]);

  if (fallback) {
    return (
      <div
        className="flex items-end justify-center border border-iron-line bg-ash-deep"
        style={{ width: VIEWER_WIDTH, height: VIEWER_HEIGHT }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar externe Crafatar */}
        <img
          src={`https://crafatar.com/avatars/${uuid}?overlay&size=160`}
          alt={`Avatar Minecraft de ${username}`}
          width={160}
          height={160}
          className="mb-16 [image-rendering:pixelated]"
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={VIEWER_WIDTH}
      height={VIEWER_HEIGHT}
      aria-label={`Skin Minecraft de ${username}`}
      className="border border-iron-line bg-ash-deep"
    />
  );
}
