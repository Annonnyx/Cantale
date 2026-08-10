/**
 * Sites de vote — miroir de la section `vote.sites` du config.yml du plugin.
 *
 * La colonne `site` de la table `votes` contient le nom affiché quand le
 * service Votifier est reconnu (ex. "Top-Serveurs.net"), sinon le
 * serviceName brut (ex. "topserveurs"). Le matching ci-dessous reprend la
 * logique souple de VoteSite.matches côté plugin : normalisation, retrait
 * du TLD et comparaison alphanumérique.
 */

export type VoteSiteConfig = {
  /** Clé normalisée stable, utilisée comme identifiant interne. */
  id: string;
  displayName: string;
  url: string;
  cooldownHours: number;
  /** Cadeaux du Roi par vote (règle du plugin : 24 h → 3, 3 h → 2, sinon 1). */
  crates: number;
  aliases: string[];
};

export const VOTE_SITES: VoteSiteConfig[] = [
  {
    id: "top-serveurs",
    displayName: "Top-Serveurs.net",
    url: "https://top-serveurs.net/minecraft/vote/cantale",
    cooldownHours: 3,
    crates: 2,
    aliases: ["top-serveurs", "top-serveurs.net", "topserveurs"],
  },
  {
    id: "serveur-prive",
    displayName: "Serveur-Prive.net",
    url: "https://serveur-prive.net/minecraft/cantale/vote",
    cooldownHours: 1,
    crates: 1,
    aliases: ["serveur-prive", "serveur-prive.net", "serveurprive"],
  },
  {
    id: "serveurliste",
    displayName: "ServeurListe.com",
    url: "https://www.serveurliste.com/fr/minecraft/cantale/vote",
    cooldownHours: 1,
    crates: 1,
    aliases: ["serveurliste", "serveurliste.com"],
  },
];

function normalize(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace("https://", "").replace("http://", "");
  if (s.startsWith("www.")) s = s.slice(4);
  const slash = s.indexOf("/");
  if (slash >= 0) s = s.slice(0, slash);
  return s.trim();
}

function stripTld(host: string): string {
  const dot = host.lastIndexOf(".");
  return dot <= 0 ? host : host.slice(0, dot);
}

function alnum(s: string): string {
  return s.replace(/[^a-z0-9]/g, "");
}

/** Heure courante en unix secondes — l'unité des timestamps des tables votes. */
export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Retrouve le site configuré correspondant à un identifiant `site` stocké
 * en base. Retourne null si l'identifiant ne correspond à rien de connu.
 */
export function matchVoteSite(stored: string): VoteSiteConfig | null {
  const service = normalize(stored);
  if (!service) return null;

  const serviceBase = stripTld(service);
  const serviceAlnum = alnum(service);
  const serviceBaseAlnum = alnum(serviceBase);

  for (const site of VOTE_SITES) {
    const candidates = [site.id, site.displayName, ...site.aliases];
    for (const candidate of candidates) {
      const norm = normalize(candidate);
      if (!norm) continue;

      if (service === norm) return site;
      if (service.includes(norm) || norm.includes(service)) return site;

      const candidateBase = stripTld(norm);
      if (serviceBase && serviceBase === candidateBase) return site;

      const candidateAlnum = alnum(norm);
      if (serviceAlnum && serviceAlnum === candidateAlnum) return site;
      if (serviceAlnum && serviceAlnum === alnum(candidateBase)) return site;
      if (serviceBaseAlnum && serviceBaseAlnum === candidateAlnum) return site;
    }
  }
  return null;
}
