import type { ReactNode } from "react";
import Link from "next/link";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

const LEGAL_NAV = [
  { href: "/mentions-legales", label: "Mentions & CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
] as const;

export function LegalPageShell({
  kicker,
  title,
  intro,
  updated,
  sections,
}: {
  kicker: string;
  title: string;
  intro: ReactNode;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-5 pb-10">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          {kicker}
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          {title}
        </h1>
        <div className="max-w-2xl text-base leading-relaxed text-steel">{intro}</div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-iron-line/60 pt-5">
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            Dernière mise à jour — <span className="text-bone">{updated}</span>
          </span>
        </div>
        <nav
          aria-label="Pages légales"
          className="flex flex-wrap gap-2 border-t border-iron-line/40 pt-5"
        >
          {LEGAL_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border border-iron-line bg-iron px-3 py-2 font-tech text-[10px] uppercase tracking-[0.2em] text-steel-light transition-colors hover:border-iron-line hover:bg-iron-light hover:text-bone"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-24 border border-iron-line bg-iron p-4">
            <span className="mb-3 block px-3 font-tech text-[10px] uppercase tracking-[0.28em] text-steel">
              Sommaire
            </span>
            <nav aria-label="Sommaire" className="flex flex-col gap-1">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-baseline gap-3 border border-transparent px-3 py-2 transition-colors hover:border-iron-line hover:bg-iron-light"
                >
                  <span className="font-display text-sm font-semibold text-steel-light transition-colors group-hover:text-bone">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-tech text-[11px] uppercase tracking-[0.14em] text-steel transition-colors group-hover:text-bone">
                    {section.title}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-10">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="reveal scroll-mt-24 border border-iron-line bg-iron"
            >
              <div className="flex items-end gap-4 border-b border-iron-line/60 px-5 py-5 sm:px-6">
                <span
                  aria-hidden="true"
                  className="font-display text-3xl font-semibold leading-none text-ember-glow/80 sm:text-4xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2
                  id={`${section.id}-title`}
                  className="pb-0.5 font-display text-xl font-semibold text-bone sm:text-2xl"
                >
                  {section.title}
                </h2>
              </div>
              <div className="legal-prose space-y-4 px-5 py-6 text-sm leading-relaxed text-steel sm:px-6">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

/** Lien interne / externe typé pour le prose légal. */
export function LegalLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    "text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
