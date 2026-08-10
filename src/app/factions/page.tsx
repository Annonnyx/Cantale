import type { Metadata } from "next";
import Link from "next/link";
import { listFactions, type FactionSort, type FactionSummary } from "@/server/repo/factions";
import { getFactionSettingsMap, type FactionSettings } from "@/server/repo/faction-settings";
import { Stamp } from "@/components/ui/stamp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Factions",
  description:
    "L'annuaire des factions de CANTALE : puissance, membres, claims et Cantox. Les camps qui se disputent le serveur, gravés dans le registre.",
};

/** Tri demandé dans l'URL (?tri=) → tri SQL whitelisté du repo. */
const SORT_OPTIONS = [
  { param: "power", sort: "power", label: "Puissance" },
  { param: "membres", sort: "members", label: "Membres" },
  { param: "cantox", sort: "balance", label: "Cantox" },
  { param: "claims", sort: "claims", label: "Claims" },
  { param: "nom", sort: "name", label: "Nom" },
] as const satisfies readonly { param: string; sort: FactionSort; label: string }[];

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR");

/** Slug d'URL : cohérent avec la normalisation de getFactionBySlug. */
function factionSlug(name: string): string {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">{label}</dt>
      <dd className="font-display text-base font-semibold text-bone">{value}</dd>
    </div>
  );
}

function FactionCard({
  faction,
  settings,
}: {
  faction: FactionSummary;
  settings: FactionSettings | undefined;
}) {
  const recruitmentOpen = settings?.recruitmentOpen ?? false;
  const description = settings?.customDescription?.trim() || faction.description;

  return (
    <Link
      href={`/factions/${factionSlug(faction.name)}`}
      className="card-lift group relative flex flex-col gap-5 border border-iron-line bg-iron p-6 hover:border-ember"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            [{faction.tag}]
          </span>
          <span className="truncate font-display text-2xl font-semibold leading-tight text-steel-light transition-colors group-hover:text-bone">
            {faction.name}
          </span>
        </div>
        {recruitmentOpen ? (
          <Stamp tone="ember">Recrute</Stamp>
        ) : (
          <Stamp tone="steel" rotation={2}>
            Fermée
          </Stamp>
        )}
      </div>

      {description && (
        <p className="line-clamp-2 text-sm leading-relaxed text-steel">{description}</p>
      )}

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-iron-line/60 pt-4 sm:grid-cols-4">
        <StatCell label="Puissance" value={NUMBER_FORMATTER.format(faction.power)} />
        <StatCell label="Membres" value={String(faction.memberCount)} />
        <StatCell label="Claims" value={String(faction.claimCount)} />
        <StatCell label="Cantox" value={NUMBER_FORMATTER.format(faction.balance)} />
      </dl>
    </Link>
  );
}

export default async function FactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tri } = await searchParams;
  const triParam = Array.isArray(tri) ? tri[0] : tri;
  const current = SORT_OPTIONS.find((option) => option.param === triParam) ?? SORT_OPTIONS[0];

  // La base peut être injoignable (local, maintenance) : le registre se tait alors proprement.
  let factions: FactionSummary[] | null = null;
  let settingsMap = new Map<number, FactionSettings>();
  try {
    factions = await listFactions(current.sort, 100);
    settingsMap = await getFactionSettingsMap(factions.map((faction) => faction.id)).catch(
      () => new Map<number, FactionSettings>(),
    );
  } catch {
    factions = null;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Le registre des camps
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Factions
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Chaque faction gravée ici pèse sur le serveur : sa puissance, ses terres, ses
          Cantox. Certaines recrutent — les autres se gardent. Le registre ne fait que
          constater.
        </p>
      </header>

      {factions !== null && factions.length > 0 ? (
        <>
          <nav aria-label="Trier les factions" className="pb-8">
            <span className="mb-3 block font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Ordre du registre
            </span>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <Link
                  key={option.param}
                  href={`/factions?tri=${option.param}`}
                  aria-current={option.param === current.param ? "true" : undefined}
                  className={`chip border px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] ${
                    option.param === current.param
                      ? "border-ember text-ember-glow"
                      : "border-iron-line text-steel hover:border-steel hover:text-bone"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="reveal reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {factions.map((faction) => (
              <FactionCard
                key={faction.id}
                faction={faction}
                settings={settingsMap.get(faction.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-start gap-4 border border-iron-line bg-iron p-8 sm:p-10">
          <p className="font-display text-xl font-semibold text-bone">
            Le registre est muet pour l&apos;instant.
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-steel">
            Aucune faction ne peut être lue — les archives ne répondent pas, ou aucun
            camp n&apos;a encore été fondé. Reviens plus tard : sur CANTALE, le vide ne
            dure jamais longtemps.
          </p>
        </div>
      )}
    </main>
  );
}
