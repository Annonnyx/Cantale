import type { CatalogItem } from "@/lib/items-data";
import { RARITY_STYLES } from "@/lib/items-data";

/**
 * Visuel typographique des items — pas de renders 3D disponibles :
 * une grille de zone pour les outils de minage (le centre = le bloc frappé),
 * un monogramme forgé pour les autres.
 */
export function ItemVisual({
  item,
  size = "md",
}: {
  item: CatalogItem;
  size?: "md" | "lg";
}) {
  const styles = RARITY_STYLES[item.rarity];
  const box = size === "lg" ? "h-28 w-28" : "h-14 w-14";

  if (item.zones && item.zones.length > 0) {
    const zone = Math.max(...item.zones);
    return (
      <span
        aria-hidden
        className={`flex ${box} items-center justify-center border border-iron-line bg-ash-deep p-1.5`}
      >
        <ZoneGrid zone={zone} accentClass={styles.bg} />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={`flex ${box} items-center justify-center border border-iron-line bg-ash-deep`}
    >
      <span
        className={`font-display font-semibold ${styles.text} ${size === "lg" ? "text-4xl" : "text-lg"}`}
      >
        {item.monogram}
      </span>
    </span>
  );
}

function ZoneGrid({ zone, accentClass }: { zone: number; accentClass: string }) {
  const cells = zone * zone;
  const center = Math.floor(cells / 2);
  return (
    <span
      className="grid h-full w-full gap-px"
      style={{ gridTemplateColumns: `repeat(${zone}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cells }, (_, i) => (
        <span
          key={i}
          className={i === center ? "bg-ember-glow" : `${accentClass} opacity-45`}
        />
      ))}
    </span>
  );
}
