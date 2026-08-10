import Link from "next/link";
import { LifeNotches } from "@/components/ui/life-notches";

export function Concept() {
  return (
    <section aria-labelledby="concept-title" className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="reveal flex flex-col gap-6">
          <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
            Le système
          </span>
          <h2
            id="concept-title"
            className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl"
          >
            Trois vies.
            <br />
            Pas une de plus.
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-steel">
            Ici, la mort n&apos;est pas un retour au spawn. Chaque joueur est forgé avec trois
            encoches — trois vies. Perds-les toutes et le registre se ferme : ton nom rejoint{" "}
            <Link href="/la-liste" className="text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone">
              La Liste
            </Link>
            , le mémorial des bannis. Chaque fight compte. Chaque choix pèse.
          </p>
          <div className="flex flex-wrap gap-8 pt-2">
            <div className="flex flex-col gap-2">
              <LifeNotches lives={3} />
              <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">En vie</span>
            </div>
            <div className="flex flex-col gap-2">
              <LifeNotches lives={1} />
              <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">Marqué</span>
            </div>
            <div className="flex flex-col gap-2">
              <LifeNotches lives={0} />
              <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">Banni</span>
            </div>
          </div>
        </div>

        <div className="reveal reveal-stagger grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Factions & claims",
              text: "Crée ta faction, claim ton territoire, fortifie-le. Les zones contestées n'appartiennent à personne — pour l'instant.",
              href: "/factions",
            },
            {
              title: "Économie Cantox",
              text: "La Cantox se gagne à la sueur : boutique admin, hôtel des ventes, échanges entre joueurs.",
              href: "/wiki",
            },
            {
              title: "Items forgés",
              text: "Pickantaxes, Cantaxes, Multi-Cantools, Cantalame — des outils qui n'existent que sur CANTALE.",
              href: "/items",
            },
            {
              title: "Primes wanted",
              text: "Une tête mise à prix change tous les équilibres. La tienne, peut-être.",
              href: "/wiki",
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="card-lift group flex flex-col gap-3 border border-iron-line bg-iron p-6 hover:border-ember"
            >
              <span className="font-display text-lg font-semibold text-steel-light transition-colors group-hover:text-bone">
                {card.title}
              </span>
              <span className="text-sm leading-relaxed text-steel">{card.text}</span>
              <span className="mt-auto pt-2 font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow">
                Découvrir <span className="cta-arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
