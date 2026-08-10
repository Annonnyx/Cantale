import { readdirSync } from "node:fs";
import { join } from "node:path";
import { GalleryLightbox } from "./gallery-lightbox";

const SCREENSHOTS_DIR = join(process.cwd(), "public", "screenshots");
const IMAGE_PATTERN = /\.(png|jpe?g|webp)$/i;

export type GalleryImage = { src: string; alt: string };

function humanize(filename: string): string {
  const base = filename.replace(IMAGE_PATTERN, "").replace(/[-_]+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** Captures déposées dans public/screenshots — liste figée au build. */
function readScreenshots(): GalleryImage[] {
  let files: string[];
  try {
    files = readdirSync(SCREENSHOTS_DIR);
  } catch {
    return [];
  }
  return files
    .filter((file) => IMAGE_PATTERN.test(file))
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }))
    .map((file) => ({ src: `/screenshots/${file}`, alt: humanize(file) }));
}

/**
 * Galerie d'accueil. Ne rend rien tant que public/screenshots est absent ou
 * vide — la section n'apparaît qu'à partir de la première capture déposée.
 */
export function Gallery() {
  const images = readScreenshots();
  if (images.length === 0) return null;

  return (
    <section aria-labelledby="galerie-title" className="border-t border-iron-line/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-24 sm:px-8 sm:py-32">
        <div className="reveal flex flex-col gap-4">
          <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
            Le monde
          </span>
          <h2
            id="galerie-title"
            className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl"
          >
            Cantale en images.
          </h2>
        </div>
        <GalleryLightbox images={images} />
      </div>
    </section>
  );
}
