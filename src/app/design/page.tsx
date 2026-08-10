import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { LifeNotches } from "@/components/ui/life-notches";
import { Stamp } from "@/components/ui/stamp";

export const metadata: Metadata = {
  title: "Design System",
  description: "Charte graphique « Le Registre » du site CANTALE — palette, typographies, composants.",
  robots: { index: false, follow: false },
};

const PALETTE = [
  { name: "Ash", token: "--color-ash", hex: "#15130f", swatch: "bg-ash", usage: "Fond principal" },
  { name: "Ash Deep", token: "--color-ash-deep", hex: "#0e0c09", swatch: "bg-ash-deep", usage: "Footer, fonds enfouis" },
  { name: "Iron", token: "--color-iron", hex: "#221e19", swatch: "bg-iron", usage: "Cartes, panneaux" },
  { name: "Iron Light", token: "--color-iron-light", hex: "#2c2721", swatch: "bg-iron-light", usage: "Surfaces survolées" },
  { name: "Iron Line", token: "--color-iron-line", hex: "#3a342c", swatch: "bg-iron-line", usage: "Bordures, séparateurs" },
  { name: "Ember", token: "--color-ember", hex: "#c6491f", swatch: "bg-ember", usage: "Accent braise, CTA" },
  { name: "Ember Glow", token: "--color-ember-glow", hex: "#e8703c", swatch: "bg-ember-glow", usage: "Accent lumineux, hover" },
  { name: "Gold", token: "--color-gold", hex: "#d9a441", swatch: "bg-gold", usage: "Récompenses, distinctions" },
  { name: "Steel", token: "--color-steel", hex: "#756f63", swatch: "bg-steel", usage: "Texte secondaire" },
  { name: "Bone", token: "--color-bone", hex: "#eee7d8", swatch: "bg-bone", usage: "Texte principal" },
] as const;

const RARITIES = [
  { name: "Rare", hex: "#5b8dd9", classes: "border-rare text-rare", item: "Pickantaxe" },
  { name: "Épique", hex: "#9b59d0", classes: "border-epique text-epique", item: "Cantaxe" },
  { name: "Mythique", hex: "#e04f5f", classes: "border-mythique text-mythique", item: "Multi-Cantool" },
  { name: "Légendaire", hex: "#d9a441", classes: "border-legendaire text-legendaire", item: "Cantalame" },
] as const;

const FONTS = [
  {
    name: "Zina",
    token: "--font-hero",
    role: "Hero — le mot CANTALE, rien d’autre",
    fontClass: "font-hero",
    sample: "CANTALE",
    sampleClass: "text-5xl tracking-[0.12em] text-bone sm:text-6xl",
  },
  {
    name: "Clash Display",
    token: "--font-display",
    role: "Titres de sections",
    fontClass: "font-display",
    sample: "Trois vies. Pas une de plus.",
    sampleClass: "text-3xl font-semibold leading-[1.05] text-bone sm:text-4xl",
  },
  {
    name: "Cabinet Grotesk",
    token: "--font-sans",
    role: "Texte courant",
    fontClass: "font-sans",
    sample: "Chaque fight compte. Chaque choix pèse. Le registre se souvient de tout, et le fer ne ment jamais.",
    sampleClass: "max-w-xl text-base leading-relaxed text-steel",
  },
  {
    name: "Nippo",
    token: "--font-tech",
    role: "Labels techniques, kickers, boutons",
    fontClass: "font-tech",
    sample: "L’effort crée les forts — 3 vies / 1 légende",
    sampleClass: "text-[11px] uppercase tracking-[0.28em] text-ember-glow",
  },
] as const;

const NOTCH_STATES = [
  { lives: 3, label: "En vie" },
  { lives: 2, label: "Entamé" },
  { lives: 1, label: "Marqué" },
  { lives: 0, label: "Banni" },
] as const;

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="border-t border-iron-line/60 py-14 first:border-t-0 first:pt-0"
    >
      <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">{kicker}</span>
      <h2 id={id} className="mt-3 font-display text-3xl font-semibold text-bone">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Interne — preview
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Design System
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          La charte « Le Registre » : sombre et chaude, jamais de noir froid ni de blanc pur.
          Chaque page du site puise dans ces tokens et ces composants.
        </p>
      </header>

      <Section id="couleurs" kicker="01 — Palette" title="Couleurs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PALETTE.map((color) => (
            <div key={color.token} className="flex flex-col overflow-hidden border border-iron-line bg-iron">
              <div className={`h-16 w-full border-b border-iron-line/60 ${color.swatch}`} />
              <div className="flex flex-col gap-1.5 p-4">
                <span className="font-display text-sm font-semibold text-bone">{color.name}</span>
                <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                  {color.hex}
                </span>
                <span className="text-xs leading-relaxed text-steel">{color.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="raretes" kicker="02 — Raretés" title="Items & boutique">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RARITIES.map((rarity) => (
            <div
              key={rarity.name}
              className={`flex flex-col gap-3 border bg-iron p-5 ${rarity.classes}`}
            >
              <span className="font-tech text-[10px] uppercase tracking-[0.24em]">
                {rarity.name} — {rarity.hex}
              </span>
              <span className="font-display text-xl font-semibold">{rarity.item}</span>
              <span className="text-xs text-steel">Bordure + libellé colorés, fond iron neutre.</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="typographie" kicker="03 — Typographie" title="Les quatre fontes">
        <div className="flex flex-col gap-4">
          {FONTS.map((font) => (
            <div
              key={font.token}
              className="flex flex-col gap-4 border border-iron-line bg-iron p-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10"
            >
              <div className="flex shrink-0 flex-col gap-1.5 sm:w-56">
                <span className="font-display text-sm font-semibold text-bone">{font.name}</span>
                <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                  {font.token}
                </span>
                <span className="text-xs leading-relaxed text-steel">{font.role}</span>
              </div>
              <p className={`${font.fontClass} ${font.sampleClass}`}>{font.sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="encoches" kicker="04 — Composant" title="Encoches de vie">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-6 border border-iron-line bg-iron p-6">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Taille md — défaut
            </span>
            <div className="flex flex-wrap items-end gap-8">
              {NOTCH_STATES.map((state) => (
                <div key={state.lives} className="flex flex-col gap-2">
                  <LifeNotches lives={state.lives} />
                  <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                    {state.lives}/3 — {state.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6 border border-iron-line bg-iron p-6">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Taille sm — listes & tableaux
            </span>
            <div className="flex flex-wrap items-end gap-8">
              {NOTCH_STATES.map((state) => (
                <div key={state.lives} className="flex flex-col gap-2">
                  <LifeNotches lives={state.lives} size="sm" />
                  <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                    {state.lives}/3 — {state.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="tampons" kicker="05 — Composant" title="Tampons">
        <div className="flex flex-wrap items-center gap-8 border border-iron-line bg-iron p-8">
          <div className="flex flex-col items-start gap-3">
            <Stamp tone="ember">Recrute</Stamp>
            <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">ember</span>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Stamp tone="gold" rotation={1.5}>Légende</Stamp>
            <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">gold</span>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Stamp tone="steel" rotation={2}>Fermée</Stamp>
            <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">steel</span>
          </div>
        </div>
      </Section>

      <Section id="boutons" kicker="06 — Actions" title="Boutons & liens">
        <div className="flex flex-col gap-10 border border-iron-line bg-iron p-8">
          <div className="flex flex-col gap-4">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Boutons
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="pressable border border-ember px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone"
              >
                Rejoindre
              </button>
              <button
                type="button"
                className="pressable border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone"
              >
                Secondaire
              </button>
              <button
                type="button"
                className="pressable bg-ember px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-bone hover:bg-ember-glow"
              >
                Plein
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-iron-line/60 pt-8">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Liens
            </span>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/design"
                className="nav-link font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:text-bone"
              >
                Lien de navigation
              </Link>
              <Link
                href="/design"
                className="nav-link text-sm text-steel hover:text-bone"
              >
                Lien de footer
              </Link>
              <Link
                href="/design"
                className="text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone"
              >
                Lien dans le texte
              </Link>
              <Link
                href="/design"
                className="font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow transition-colors hover:text-bone"
              >
                Découvrir →
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
