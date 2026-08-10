import type { CSSProperties, ReactNode } from "react";

type StampTone = "ember" | "gold" | "steel";

const TONE_CLASSES: Record<StampTone, string> = {
  ember: "border-ember text-ember-glow",
  gold: "border-gold text-gold",
  steel: "border-steel text-steel",
};

/** Tampon officiel — statuts (recrute, fermée, banni, grade…). */
export function Stamp({
  children,
  tone = "ember",
  rotation = -2,
}: {
  children: ReactNode;
  tone?: StampTone;
  rotation?: number;
}) {
  return (
    <span
      className={`stamp-ink inline-block border-2 px-2.5 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.24em] ${TONE_CLASSES[tone]}`}
      style={{ "--stamp-rot": `${rotation}deg` } as CSSProperties}
    >
      {children}
    </span>
  );
}
