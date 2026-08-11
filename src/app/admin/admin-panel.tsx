"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { playerProfilePath } from "@/lib/player-profile";

type ListedPlayer = {
  uuid: string;
  username: string;
  lives: number;
  balance: number;
  online: boolean;
};
type Ticket = { id: string; name: string; topic: string | null; open: boolean; url: string };

const PLAYERS_PAGE_SIZE = 50;

export function AdminPanel() {
  const [online, setOnline] = useState(0);
  const [max, setMax] = useState<number | null>(null);
  const [players, setPlayers] = useState<ListedPlayer[]>([]);
  const [playersTotal, setPlayersTotal] = useState(0);
  const [playersPage, setPlayersPage] = useState(1);
  const [listQuery, setListQuery] = useState("");
  const [debouncedListQuery, setDebouncedListQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const refreshTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { tickets?: Ticket[] };
      setTickets(data.tickets ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedListQuery((prev) => {
        if (prev !== listQuery) setPlayersPage(1);
        return listQuery;
      });
    }, 250);
    return () => clearTimeout(t);
  }, [listQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      try {
        const params = new URLSearchParams({
          page: String(playersPage),
          limit: String(PLAYERS_PAGE_SIZE),
        });
        if (debouncedListQuery.trim()) params.set("q", debouncedListQuery.trim());
        const res = await fetch(`/api/admin/players?${params}`, { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          let message = `Erreur ${res.status} en chargeant la liste.`;
          try {
            const body = (await res.json()) as { error?: string };
            if (body.error) message = body.error;
          } catch {
            /* keep status message */
          }
          if (res.status === 404) {
            message =
              "Route /api/admin/players absente du déploiement — redeploy le site (repo Vercel = code web à jour).";
          }
          setListError(message);
          setPlayers([]);
          setPlayersTotal(0);
          return;
        }
        const data = (await res.json()) as {
          players?: ListedPlayer[];
          total?: number;
          online?: number;
          max?: number | null;
          updatedAt?: string | null;
          error?: string;
        };
        if (cancelled) return;
        setListError(null);
        setPlayers(data.players ?? []);
        setPlayersTotal(Number(data.total) || 0);
        setOnline(Number(data.online) || 0);
        setMax(data.max ?? null);
        setUpdatedAt(data.updatedAt ?? null);
      } catch {
        if (cancelled) return;
        setListError("Impossible de joindre /api/admin/players.");
        setPlayers([]);
        setPlayersTotal(0);
      }
    }

    const kickoff = setTimeout(() => {
      void loadPlayers();
      void refreshTickets();
    }, 0);
    const interval = setInterval(() => {
      void loadPlayers();
      void refreshTickets();
    }, 15_000);
    return () => {
      cancelled = true;
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [debouncedListQuery, playersPage, refreshTickets]);

  const totalPages = Math.max(1, Math.ceil(playersTotal / PLAYERS_PAGE_SIZE));

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <section className="border border-iron-line bg-iron p-5">
        <h2 className="font-display text-xl text-bone">Joueurs</h2>
        <p className="mt-2 font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
          {online}
          {max != null ? ` / ${max}` : ""} en ligne · {playersTotal} au total
          {updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString("fr-FR")}` : ""}
        </p>
        <p className="mt-3 text-sm text-steel-light">
          Clique un joueur pour ouvrir son profil (lecture publique + outils Direction).
        </p>

        <input
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
          placeholder="Rechercher pseudo / UUID"
          className="mt-4 w-full border border-iron-line bg-ash-deep px-4 py-3 text-sm text-bone placeholder:text-steel focus:border-ember focus:outline-none"
        />

        <ul className="mt-4 max-h-[32rem] space-y-1 overflow-y-auto">
          {listError ? (
            <li className="text-sm text-ember-glow">{listError}</li>
          ) : players.length === 0 ? (
            <li className="text-sm text-steel">
              {debouncedListQuery.trim()
                ? "Aucun joueur trouvé."
                : "Aucun joueur en base (ou DB inaccessible)."}
            </li>
          ) : (
            players.map((p) => (
              <li key={p.uuid}>
                <Link
                  href={playerProfilePath(p.uuid)}
                  className="flex w-full items-center justify-between gap-2 px-2 py-2 text-steel-light transition-colors hover:bg-ash-deep/60 hover:text-bone"
                >
                  <span className="min-w-0 truncate font-tech text-xs uppercase tracking-[0.18em]">
                    {p.username}
                    <span className="ml-2 text-steel normal-case tracking-normal">
                      · {p.lives} vies · {Math.floor(p.balance)} Cantox
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-tech text-[9px] uppercase tracking-[0.16em] ${
                      p.online ? "text-ember-glow" : "text-steel"
                    }`}
                  >
                    {p.online ? "Online" : "Offline"}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={playersPage <= 1}
              onClick={() => setPlayersPage((p) => Math.max(1, p - 1))}
              className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel-light hover:text-bone disabled:opacity-40"
            >
              Préc.
            </button>
            <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
              {playersPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={playersPage >= totalPages}
              onClick={() => setPlayersPage((p) => Math.min(totalPages, p + 1))}
              className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel-light hover:text-bone disabled:opacity-40"
            >
              Suiv.
            </button>
          </div>
        )}
      </section>

      <section className="border border-iron-line bg-iron p-5">
        <h2 className="font-display text-xl text-bone">Tickets Discord</h2>
        <ul className="mt-4 max-h-[36rem] space-y-2 overflow-y-auto">
          {tickets.length === 0 ? (
            <li className="text-sm text-steel">Aucun salon ticket visible.</li>
          ) : (
            tickets.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 border-b border-iron-line/40 py-2"
              >
                <span className="truncate font-tech text-[10px] uppercase tracking-[0.16em] text-steel-light">
                  {t.open ? "OPEN" : "CLOSED"} · {t.name}
                </span>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-tech text-[10px] uppercase tracking-[0.18em] text-ember-glow hover:text-bone"
                >
                  Ouvrir
                </a>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
