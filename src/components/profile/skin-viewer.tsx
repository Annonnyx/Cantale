"use client";

import { useEffect, useRef, useState } from "react";
import { minecraftAvatarUrl, minecraftSkinUrl } from "@/lib/minecraft-skin";

const VIEWER_WIDTH = 300;
const VIEWER_HEIGHT = 420;

/**
 * Rendu 3D du skin Minecraft (skinview3d, animation idle + rotation douce).
 * Texture via `/api/minecraft/skin` (proxy same-origin). L'avatar 2D s'affiche
 * tout de suite — le 3D ne bloque jamais le profil.
 */
export function SkinViewer({ uuid, username }: { uuid: string; username: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready3d, setReady3d] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(() =>
    minecraftAvatarUrl(uuid || username, 160),
  );

  useEffect(() => {
    setAvatarSrc(minecraftAvatarUrl(uuid || username, 160));
    setFallback(false);
    setReady3d(false);
  }, [uuid, username]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const skinId = uuid || (username !== "Inconnu" ? username : "");
    if (!canvas || !skinId) {
      setFallback(true);
      return;
    }

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

        try {
          await viewer.loadSkin(minecraftSkinUrl(skinId), { model: "auto-detect" });
        } catch {
          if (!username || username === "Inconnu" || username === skinId) {
            throw new Error("skin_load_failed");
          }
          await viewer.loadSkin(minecraftSkinUrl(username), { model: "auto-detect" });
        }
        if (!cancelled) setReady3d(true);
      } catch {
        if (!cancelled) setFallback(true);
      }
    };

    init();
    return () => {
      cancelled = true;
      viewer?.dispose();
    };
  }, [uuid, username]);

  const avatar = (
    // eslint-disable-next-line @next/next/no-img-element -- avatar proxy local
    <img
      src={avatarSrc}
      alt={`Avatar Minecraft de ${username}`}
      width={160}
      height={160}
      className="mb-16 [image-rendering:pixelated]"
      onError={() => {
        if (username && username !== "Inconnu") {
          const byName = minecraftAvatarUrl(username, 160);
          setAvatarSrc((prev) => (prev === byName ? prev : byName));
        }
      }}
    />
  );

  if (fallback) {
    return (
      <div
        className="flex items-end justify-center border border-iron-line bg-ash-deep"
        style={{ width: VIEWER_WIDTH, height: VIEWER_HEIGHT }}
      >
        {avatar}
      </div>
    );
  }

  return (
    <div
      className="relative border border-iron-line bg-ash-deep"
      style={{ width: VIEWER_WIDTH, height: VIEWER_HEIGHT }}
    >
      {!ready3d && (
        <div className="absolute inset-0 flex items-end justify-center" aria-hidden={!ready3d}>
          {avatar}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={VIEWER_WIDTH}
        height={VIEWER_HEIGHT}
        aria-label={`Skin Minecraft de ${username}`}
        className={ready3d ? "block" : "invisible absolute inset-0"}
      />
    </div>
  );
}
