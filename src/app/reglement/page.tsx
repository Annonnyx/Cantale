import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Stamp } from "@/components/ui/stamp";

export const metadata: Metadata = {
  title: "Règlement",
  description:
    "Le règlement officiel de CANTALE : respect, gameplay hardcore à trois vies, factions, économie, grades premium et modération. En jouant, tu l'acceptes dans son intégralité.",
};

type SeverityTone = "ember" | "gold" | "steel";

type Severity = {
  tone: SeverityTone;
  label: string;
};

type Rule = {
  title: ReactNode;
  description: ReactNode;
  severity?: Severity;
};

type RuleSection = {
  id: string;
  num: string;
  label: string;
  title: string;
  nav: string;
  rules: Rule[];
};

const LAST_UPDATE = "Août 2026";

function Cmd({ children }: { children: ReactNode }) {
  return (
    <code className="inline-block bg-ash px-1.5 py-0.5 font-tech text-[11px] font-bold tracking-[0.06em] text-ember-glow">
      {children}
    </code>
  );
}

const SECTIONS: RuleSection[] = [
  {
    id: "general",
    num: "01",
    label: "Savoir-vivre",
    title: "Règles générales",
    nav: "Général",
    rules: [
      {
        title: "Respecte tous les joueurs",
        description:
          "Insultes, harcèlement, racisme, homophobie ou tout comportement toxique entraînent une sanction immédiate, sans avertissement préalable.",
        severity: { tone: "gold", label: "Sanction immédiate" },
      },
      {
        title: "La triche est interdite",
        description:
          "Les clients modifiés — x-ray, fly hack, kill aura et assimilés — sont strictement interdits, en toutes circonstances.",
        severity: { tone: "ember", label: "Bannissement permanent" },
      },
      {
        title: "Pas d’exploitation de bugs",
        description:
          "Si tu trouves un bug, signale-le au staff. L’exploiter à ton avantage entraîne une sanction — les duplications d’items sont particulièrement visées.",
        severity: { tone: "gold", label: "Sanction sévère" },
      },
      {
        title: "Pas de spam ni de flood",
        description:
          "Le chat doit rester lisible pour tout le monde. La publicité pour d’autres serveurs vaut un bannissement immédiat.",
        severity: { tone: "ember", label: "Bannissement" },
      },
      {
        title: "Langue française",
        description:
          "Cantale est un serveur francophone : le français est exigé dans le chat public.",
        severity: { tone: "gold", label: "Avertissement" },
      },
    ],
  },
  {
    id: "gameplay",
    num: "02",
    label: "Trois vies, une légende",
    title: "Gameplay & vies",
    nav: "Gameplay & Vies",
    rules: [
      {
        title: "Trois vies, pas une de plus",
        description:
          "Chaque mort retire une vie. À zéro vie, le bannissement est automatique. Les admins ne redonnent pas de vies, sauf circonstances exceptionnelles documentées.",
        severity: { tone: "ember", label: "Automatique & irréversible" },
      },
      {
        title: "Le PvP est ouvert",
        description:
          "N’importe qui peut attaquer n’importe qui hors des zones protégées. C’est la loi de Cantale.",
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Items custom non craftables",
        description: (
          <>
            Les items forgés s’obtiennent uniquement via <Cmd>/ah</Cmd>, les échanges{" "}
            <Cmd>/trade</Cmd> ou les récompenses de grade. Aucun craft possible.
          </>
        ),
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Falsification d’items interdite",
        description:
          "Renommer un item pour imiter un custom item est passible de sanction immédiate.",
        severity: { tone: "gold", label: "Sanction immédiate" },
      },
      {
        title: "Le système /wanted est légal",
        description:
          "Mettre une prime sur la tête d’un joueur fait partie intégrante du gameplay. Les chasses à l’homme sont encouragées.",
        severity: { tone: "steel", label: "Info" },
      },
    ],
  },
  {
    id: "factions",
    num: "03",
    label: "Territoire & alliances",
    title: "Factions & territoire",
    nav: "Factions",
    rules: [
      {
        title: "Noms de faction appropriés",
        description:
          "Pas de noms offensants, racistes ou à connotation illégale. La sanction tombe sans avertissement.",
        severity: { tone: "gold", label: "Dissolution de faction" },
      },
      {
        title: "Les claims sont définitifs sauf conquête",
        description: (
          <>
            Utilise <Cmd>/f claim</Cmd> pour revendiquer un territoire. L’unclaim est possible
            uniquement par les officiers et les leaders de la faction.
          </>
        ),
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Le mode PASDIC",
        description: (
          <>
            Protège les chunks critiques de ta faction. Son activation nécessite un vote interne.
            Voir <Cmd>/pasdic</Cmd>.
          </>
        ),
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Banques gérées par les officiers",
        description: (
          <>
            Le retrait des fonds de faction est soumis aux permissions de grade. Voir{" "}
            <Cmd>/f bank</Cmd>.
          </>
        ),
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Mode secret — 24 h",
        description: (
          <>
            Un cooldown de 24 heures s’applique entre chaque activation. Voir{" "}
            <Cmd>/f secret</Cmd>.
          </>
        ),
        severity: { tone: "steel", label: "Info" },
      },
    ],
  },
  {
    id: "economie",
    num: "04",
    label: "Cantox & échanges",
    title: "Économie & échanges",
    nav: "Économie",
    rules: [
      {
        title: "Les Cantox sont la monnaie officielle",
        description: (
          <>
            Utilise <Cmd>/pay</Cmd> pour payer un joueur et <Cmd>/balance</Cmd> pour consulter ton
            solde. Aucune autre monnaie n’est reconnue.
          </>
        ),
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "L’hôtel des ventes est régulé",
        description:
          "Pas de listings abusifs ou trompeurs. Les admins se réservent le droit de retirer des annonces sans préavis.",
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Les arnaques sont interdites",
        description: (
          <>
            Tromper un joueur lors d’un échange <Cmd>/trade</Cmd> est passible de sanction
            immédiate.
          </>
        ),
        severity: { tone: "gold", label: "Sanction immédiate" },
      },
      {
        title: "Pas de commerce IRL",
        description:
          "Vendre des items ou des Cantox contre de l’argent réel en dehors de la boutique officielle entraîne un bannissement permanent.",
        severity: { tone: "ember", label: "Bannissement permanent" },
      },
    ],
  },
  {
    id: "grades",
    num: "05",
    label: "Aventurier · VIP · Chèvre",
    title: "Grades premium",
    nav: "Grades Premium",
    rules: [
      {
        title: "Trois grades : Aventurier, VIP, Chèvre",
        description:
          "Chaque grade inclut les avantages du grade inférieur. Consulte la boutique pour le détail complet de chacun.",
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Avantages personnels",
        description:
          "Partager un coffre privé ou prêter un Statio-Lytra est toléré, mais l’abus sera sanctionné.",
        severity: { tone: "gold", label: "Abus sanctionné" },
      },
      {
        title: "Bonus Cantox limité à 1× par jour",
        description:
          "Se déconnecter puis se reconnecter ne donne aucun bonus supplémentaire. Seule la première connexion du jour compte.",
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Vies mensuelles — items consommables",
        description:
          "1 vie par mois (Aventurier), 2 (VIP), 3 (Chèvre). Ce sont des items stockables, utilisables quand tu veux d’un simple clic droit.",
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Vol créatif Chèvre — claims uniquement",
        description:
          "Le vol créatif ne fonctionne que dans les claims de ta propre faction. Hors claims, la chute est normale.",
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Coffres privés — conservation 30 jours",
        description:
          "Les items des coffres privés sont conservés 30 jours après l’expiration du grade. Au-delà, ils sont définitivement supprimés.",
        severity: { tone: "steel", label: "Info" },
      },
    ],
  },
  {
    id: "moderation",
    num: "06",
    label: "Staff & sanctions",
    title: "Modération",
    nav: "Modération",
    rules: [
      {
        title: "Les décisions du staff sont finales",
        description:
          "Les contestations se font uniquement via le Discord, jamais en jeu. Une fois tranchée, une décision est définitive.",
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Sanctions progressives",
        description:
          "Avertissement → mute → kick → bannissement temporaire → bannissement permanent. Selon la gravité des faits, des étapes peuvent être sautées.",
        severity: { tone: "steel", label: "Info" },
      },
      {
        title: "Bannissement à zéro vie — automatique",
        description:
          "Ce n’est pas une sanction du staff : c’est le système de vies hardcore. Irréversible par nature.",
        severity: { tone: "ember", label: "Système automatique" },
      },
      {
        title: "Signalements via /moderation",
        description: (
          <>
            Signale un joueur via <Cmd>/moderation</Cmd> ou sur le Discord. Fournis impérativement
            des preuves — screenshots, vidéo. Sans preuve, pas de traitement.
          </>
        ),
        severity: { tone: "gold", label: "Preuves requises" },
      },
    ],
  },
];

const LEGEND: { tone: SeverityTone; label: string; description: string }[] = [
  { tone: "steel", label: "Info", description: "Règle de fonctionnement, sans sanction directe" },
  { tone: "gold", label: "Avertissement", description: "Sanction graduée ou immédiate possible" },
  { tone: "ember", label: "Bannissable", description: "Bannissement direct, souvent permanent" },
];

function SommaireLinks() {
  return (
    <nav aria-label="Sommaire du règlement" className="flex flex-col gap-1">
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="group flex items-baseline gap-3 border border-transparent px-3 py-2 transition-colors hover:border-iron-line hover:bg-iron-light"
        >
          <span className="font-display text-sm font-semibold text-steel-light transition-colors group-hover:text-bone">
            {section.num}
          </span>
          <span className="font-tech text-[11px] uppercase tracking-[0.18em] text-steel transition-colors group-hover:text-bone">
            {section.nav}
          </span>
        </a>
      ))}
    </nav>
  );
}

export default function ReglementPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      {/* ——— En-tête ——— */}
      <header className="flex flex-col gap-5 pb-12">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Le registre — loi du serveur
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Règlement
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Le non-respect de ces règles entraîne des sanctions allant du mute au bannissement
          définitif. Aucune exception. En jouant sur Cantale, tu acceptes ce règlement dans son
          intégralité.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-iron-line/60 pt-5">
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            Dernière mise à jour — <span className="text-bone">{LAST_UPDATE}</span>
          </span>
          <span className="hidden h-3 w-px bg-iron-line sm:block" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGEND.map((item) => (
              <span key={item.tone} className="flex items-center gap-2" title={item.description}>
                <Stamp tone={item.tone} rotation={0}>
                  {item.label}
                </Stamp>
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ——— Sommaire mobile ——— */}
      <details className="group mb-10 border border-iron-line bg-iron lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="font-tech text-[11px] uppercase tracking-[0.24em] text-bone">
            Sommaire
          </span>
          <span
            aria-hidden="true"
            className="font-display text-lg leading-none text-ember-glow transition-transform duration-200 group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <div className="border-t border-iron-line/60 px-2 py-3">
          <SommaireLinks />
        </div>
      </details>

      {/* ——— Layout sidebar + contenu ——— */}
      <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-24 border border-iron-line bg-iron p-4">
            <span className="mb-3 block px-3 font-tech text-[10px] uppercase tracking-[0.28em] text-steel">
              Sommaire
            </span>
            <SommaireLinks />
            <div className="mt-4 border-t border-iron-line/60 px-3 pt-4">
              <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
                Mise à jour
              </span>
              <span className="mt-1 block font-display text-sm font-semibold text-bone">
                {LAST_UPDATE}
              </span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-14">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="reveal scroll-mt-24"
            >
              <div className="flex items-end gap-5 border-b border-iron-line/60 pb-5">
                <span
                  aria-hidden="true"
                  className="font-display text-5xl font-semibold leading-[0.85] text-ember-glow/80 sm:text-6xl"
                >
                  {section.num}
                </span>
                <div className="min-w-0 pb-0.5">
                  <span className="font-tech text-[10px] uppercase tracking-[0.28em] text-steel">
                    {section.label}
                  </span>
                  <h2
                    id={`${section.id}-title`}
                    className="mt-1 font-display text-2xl font-semibold leading-tight text-bone sm:text-3xl"
                  >
                    {section.title}
                  </h2>
                </div>
              </div>

              <ul className="divide-y divide-iron-line/60 border-x border-b border-iron-line bg-iron">
                {section.rules.map((rule, index) => (
                  <li key={index} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold text-bone">
                          {rule.title}
                        </h3>
                        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-steel">
                          {rule.description}
                        </p>
                      </div>
                      {rule.severity && (
                        <div className="shrink-0 sm:pt-0.5">
                          <Stamp tone={rule.severity.tone}>{rule.severity.label}</Stamp>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* ——— Avertissement final ——— */}
          <section className="reveal border border-ember/60 bg-iron p-6 sm:p-10">
            <Stamp tone="ember">Avertissement</Stamp>
            <h2 className="mt-5 max-w-xl font-display text-2xl font-semibold leading-tight text-bone sm:text-3xl">
              Ces règles peuvent évoluer.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel">
              Tout changement est annoncé sur le{" "}
              <a
                href="https://discord.gg/65a9upGPHx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone"
              >
                Discord
              </a>{" "}
              avec un préavis minimum de 48 h. L’ignorance des règles n’est pas une excuse
              valable : en jouant sur Cantale, tu acceptes ce règlement dans son intégralité, y
              compris ses révisions futures.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
