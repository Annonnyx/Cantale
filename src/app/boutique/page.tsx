import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/server/env";
import { Stamp } from "@/components/ui/stamp";
import { BoutiqueShop } from "./shop-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "La boutique de CANTALE : grades Aventurier, VIP et GØAT, vies hardcore et clés de caisse. Soutiens le serveur, récolte des avantages réels.",
};

/** Teaser sobre — aucun prix, aucun bouton : le catalogue n'est pas rendu. */
const TEASERS = [
  {
    title: "Trois rangs mensuels",
    text: "Aventurier, VIP et GØAT — vies mensuelles, bonus de Cantox quotidien, coffres privés et vol en claims.",
  },
  {
    title: "Vies hardcore",
    text: "L'item le plus précieux du serveur, à l'unité ou en packs dégressifs.",
  },
  {
    title: "Clés de caisse",
    text: "Trésor Public, Médaille du Tournoi, Pièce Mythique, Ticket Légendaire — les quatre paliers de butin.",
  },
] as const;

function ComingSoon() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-8">
        <header className="flex flex-col gap-4">
          <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
            Registre — Boutique
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
            La boutique
          </h1>
          <Stamp tone="gold" rotation={-2}>
            Bientôt
          </Stamp>
        </header>

        <div className="flex w-full flex-col gap-6 border border-iron-line bg-iron p-6 sm:p-8">
          <p className="max-w-xl text-base leading-relaxed text-steel">
            La boutique n&apos;est pas encore ouverte. Les rangs, les vies et les clés de
            caisse sont déjà gravés dans le registre — il ne manque que la prise de
            paiement, en cours d&apos;intégration. Aucun achat n&apos;est possible pour
            l&apos;instant, et rien ne sera prélevé sans que ce soit annoncé.
          </p>

          <ul className="grid gap-4 sm:grid-cols-3">
            {TEASERS.map((teaser) => (
              <li
                key={teaser.title}
                className="card-soft flex flex-col gap-2 border border-iron-line/70 bg-ash-deep p-4"
              >
                <span className="font-display text-sm font-semibold text-bone">
                  {teaser.title}
                </span>
                <span className="text-xs leading-relaxed text-steel">{teaser.text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-4 border-t border-iron-line/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-steel">
              En attendant, les caisses se gagnent déjà en jeu : vote chaque jour et
              fais monter le Cadeau du Roi, étape par étape.
            </p>
            <Link
              href="/vote"
              className="pressable inline-block shrink-0 border border-ember px-4 py-2 text-center font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone"
            >
              Voter pour le serveur
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BoutiquePage() {
  // Le flag est lu côté serveur : désactivé, le catalogue n'est jamais rendu.
  if (!env.shopEnabled) return <ComingSoon />;
  return <BoutiqueShop />;
}
