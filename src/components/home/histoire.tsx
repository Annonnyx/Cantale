import Link from "next/link";

export function Histoire() {
  return (
    <section aria-labelledby="histoire-title" className="border-t border-iron-line/60 bg-ash-deep">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_1.6fr]">
        <div className="reveal flex flex-col gap-4">
          <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
            Le registre
          </span>
          <h2 id="histoire-title" className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
            Forgé, pas codé.
          </h2>
        </div>

        <div className="reveal flex flex-col gap-6 text-base leading-relaxed text-steel">
          <p>
            CANTALE est né d&apos;une conviction simple : le PvP factions est devenu trop
            confortable. Les morts sans conséquence, les économies gonflées, les territoires
            acquis sans combat. Ici, chaque mécanique a été forgée sur mesure — un plugin
            entièrement développé pour le serveur — pour rendre au jeu son poids.
          </p>
          <p>
            Trois vies, une monnaie qui se mérite, des items qui n&apos;existent nulle part
            ailleurs, des factions qui se déchirent pour des zones contestées. Pas de reset
            facile, pas de seconde chance achetée : ce qui est perdu l&apos;est vraiment, et ce
            qui est gagné se raconte.
          </p>
          <p>
            Le registre n&apos;oublie rien : chaque victoire, chaque mort, chaque bannissement y
            est consigné. Le reste appartient à ceux qui entrent dans la forge.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/wiki"
              className="pressable border border-iron-line px-5 py-3 font-tech text-[11px] uppercase tracking-[0.22em] text-steel-light hover:border-ember hover:text-bone"
            >
              Lire le wiki
            </Link>
            <Link
              href="/reglement"
              className="pressable border border-iron-line px-5 py-3 font-tech text-[11px] uppercase tracking-[0.22em] text-steel-light hover:border-ember hover:text-bone"
            >
              Le règlement
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
