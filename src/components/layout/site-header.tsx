import Link from "next/link";
import { AuthEntry } from "./auth-entry";
import { DesktopMoreMenu } from "./desktop-more-menu";
import { LiveCounter } from "./live-counter";
import { MobileMenu } from "./mobile-menu";

const NAV_LINKS = [
  { href: "/items", label: "Items" },
  { href: "/factions", label: "Factions" },
  { href: "/classements", label: "Classements" },
  { href: "/carte", label: "Carte" },
  { href: "/wiki", label: "Wiki" },
  { href: "/vote", label: "Vote" },
  { href: "/recrutement", label: "Recrutement" },
  { href: "/partenariats", label: "Partenariats" },
];

/** Découverte secondaire — footer + menu « Plus » (mobile et desktop). */
const EXTRA_LINKS = [
  { href: "/reglement", label: "Règlement" },
  { href: "/boutique", label: "Boutique" },
  { href: "/stats", label: "Statistiques" },
  { href: "/la-liste", label: "La Liste" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-iron-line/40 bg-ash/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-hero text-xl tracking-[0.18em] text-steel-light transition-colors hover:text-bone"
        >
          CANTALE
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-7 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link font-tech text-[11px] uppercase tracking-[0.22em] text-steel-light hover:text-bone"
            >
              {link.label}
            </Link>
          ))}
          <DesktopMoreMenu links={EXTRA_LINKS} />
        </nav>

        <div className="flex items-center gap-4">
          <LiveCounter />
          <span className="hidden lg:inline-block">
            <AuthEntry />
          </span>
          <Link
            href="/#rejoindre"
            className="pressable hidden border border-ember px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone sm:inline-block"
          >
            Rejoindre
          </Link>
          <MobileMenu
            links={NAV_LINKS}
            extraLinks={EXTRA_LINKS}
            authLink={{ href: "/connexion", label: "Connexion / Profil" }}
          />
        </div>
      </div>
    </header>
  );
}
