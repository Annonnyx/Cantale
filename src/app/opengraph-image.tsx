import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "CANTALE — Serveur Minecraft PvP factions hardcore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  // Satori (next/og) n'accepte que TTF/OTF — pas le WOFF2 du site.
  const zina = readFileSync(join(process.cwd(), "src/assets/fonts/Zina-Regular.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(160deg, #15130f 0%, #0e0c09 100%)",
          border: "3px solid #c6491f",
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            color: "#8d877a",
            fontSize: 24,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 12, height: 12, background: "#c6491f" }} />
          Serveur Minecraft — PvP Factions Hardcore
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "Zina",
              fontSize: 190,
              lineHeight: 1,
              color: "#eee7d8",
              letterSpacing: "0.1em",
            }}
          >
            CANTALE
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "#e8703c",
              fontSize: 30,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            L’effort crée les forts
          </span>
          <span style={{ color: "#756f63", fontSize: 22, letterSpacing: "0.3em" }}>
            CANTALE.WORLD
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Zina", data: zina, weight: 400, style: "normal" }],
    },
  );
}
