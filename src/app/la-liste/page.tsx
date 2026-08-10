import type { Metadata } from "next";
import { getDeadPlayers } from "@/server/repo/players";
import { LaListeClient, type DeadPlayer } from "./la-liste-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La Liste",
  description:
    "La Liste — le mémorial des bannis de CANTALE. Trois vies perdues, un nom gravé au registre pour toujours.",
};

/**
 * Mémorial public des joueurs tombés à 0 vie.
 * La base peut être injoignable (local, maintenance) : le registre
 * reste alors silencieux plutôt que de casser la page.
 */
export default async function LaListePage() {
  let players: DeadPlayer[] = [];
  let available = true;

  try {
    const dead = await getDeadPlayers();
    players = dead.map((player) => ({
      uuid: player.uuid,
      username: player.username,
      kills: player.kills,
      deaths: player.deaths,
      killStreak: player.killStreak,
      lastDeath: player.lastDeath,
      playtime: player.playtime,
    }));
  } catch {
    available = false;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Mémorial
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          La Liste
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Trois vies, puis le registre se ferme. Ici sont gravés les noms de celles et ceux
          qui ont tout perdu — leurs combats, leurs séries, leurs heures. Le registre ne
          juge pas : il se souvient.
        </p>
      </header>

      {available && players.length > 0 ? (
        <LaListeClient players={players} />
      ) : (
        <div className="flex flex-col items-start gap-4 border border-iron-line bg-iron p-8 sm:p-10">
          <p className="font-display text-xl font-semibold text-bone">
            Le registre est muet pour l&apos;instant.
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-steel">
            Aucun nom ne peut être lu — les archives ne répondent pas, ou aucun joueur
            n&apos;a encore rendu sa dernière vie. Reviens plus tard : la liste ne
            s&apos;écrit jamais longtemps d&apos;avance.
          </p>
        </div>
      )}
    </main>
  );
}
