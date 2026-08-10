import Link from "next/link";
import { CopyIp } from "./copy-ip";

const FOOTER_LINKS = [
  {
    title: "Jouer",
    links: [
      { href: "/#rejoindre", label: "Rejoindre" },
      { href: "/vote", label: "Voter" },
      { href: "/reglement", label: "Règlement" },
      { href: "/wiki", label: "Wiki" },
      { href: "/boutique", label: "Boutique" },
    ],
  },
  {
    title: "Serveur",
    links: [
      { href: "/factions", label: "Factions" },
      { href: "/classements", label: "Classements" },
      { href: "/stats", label: "Statistiques" },
      { href: "/carte", label: "Carte" },
      { href: "/la-liste", label: "La Liste" },
    ],
  },
  {
    title: "Communauté",
    links: [
      { href: "/recrutement", label: "Recrutement" },
      { href: "/partenariats", label: "Partenariats" },
      { href: "/connexion", label: "Connexion" },
      { href: "https://discord.gg/65a9upGPHx", label: "Discord", external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-iron-line/60 bg-ash-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <span className="font-hero text-2xl tracking-[0.18em] text-bone">CANTALE</span>
          <p className="max-w-xs text-sm leading-relaxed text-steel-light">
            Serveur Minecraft PvP factions hardcore. Trois vies, une seule légende.
          </p>
          <CopyIp />
        </div>

        {FOOTER_LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3">
            <span className="font-tech text-[10px] uppercase tracking-[0.28em] text-ember-glow">
              {group.title}
            </span>
            {group.links.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link w-fit text-sm text-steel-light hover:text-bone"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link w-fit text-sm text-steel-light hover:text-bone"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        ))}
      </div>

      <div className="border-t border-iron-line/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 font-tech text-[10px] uppercase tracking-[0.22em] text-steel-light sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>CANTALE — L&apos;effort crée les forts</span>
          <span>Non affilié à Mojang ni Microsoft</span>
        </div>
      </div>
    </footer>
  );
}
