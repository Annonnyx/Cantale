"use client";

/* Avatars via /api/minecraft/avatar (proxy serveur) : <img> natif. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LifeNotches } from "@/components/ui/life-notches";
import { Stamp } from "@/components/ui/stamp";
import { playerProfilePath } from "@/lib/player-profile";
import { PlayerLink } from "@/components/player/player-link";
import { minecraftAvatarUrl } from "@/lib/minecraft-skin";

export type DeadPlayer = {
  uuid: string;
  username: string;
  kills: number;
  deaths: number;
  killStreak: number;
  /** Unix secondes — toujours > 0 ici (critère du registre). */
  lastDeath: number;
  /** Secondes cumulées. */
  playtime: number;
};

type SortOrder = "recent" | "ancien";

const PAGE_SIZE = 12;

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

function formatDeathDate(unixSeconds: number): string {
  return DATE_FORMATTER.format(new Date(unixSeconds * 1000));
}

function formatPlaytime(seconds: number): string {
  if (seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  if (hours < 1) return `${Math.max(1, Math.floor(seconds / 60))} min`;
  if (hours < 48) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} j ${hours % 24} h`;
}

function avatarUrl(uuid: string): string {
  return minecraftAvatarUrl(uuid, 64);
}

export function LaListeClient({ players }: { players: DeadPlayer[] }) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<SortOrder>("recent");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DeadPlayer | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? players.filter((player) => player.username.toLowerCase().includes(needle))
      : players;
    return [...matches].sort((a, b) =>
      order === "recent" ? b.lastDeath - a.lastDeath : a.lastDeath - b.lastDeath,
    );
  }, [players, query, order]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagePlayers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 border border-iron-line bg-iron p-5 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex w-full flex-col gap-2 sm:max-w-sm">
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            Rechercher un nom
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Un pseudo gravé…"
            className="w-full border border-iron-line bg-ash-deep px-4 py-2.5 font-sans text-sm text-bone placeholder:text-steel/60 focus:border-ember focus:outline-none"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            Ordre du registre
          </legend>
          <div className="flex gap-2">
            {(
              [
                { value: "recent", label: "Plus récents" },
                { value: "ancien", label: "Plus anciens" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={order === option.value}
                onClick={() => {
                  setOrder(option.value);
                  setPage(1);
                }}
                className={`chip border px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] ${
                  order === option.value
                    ? "border-ember text-ember-glow"
                    : "border-iron-line text-steel hover:border-steel hover:text-bone"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p aria-live="polite" className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
        {filtered.length} nom{filtered.length > 1 ? "s" : ""} gravé{filtered.length > 1 ? "s" : ""}
      </p>

      {pagePlayers.length === 0 ? (
        <div className="border border-iron-line bg-iron p-8">
          <p className="font-display text-xl font-semibold text-bone">Aucun nom ne répond.</p>
          <p className="mt-2 text-sm leading-relaxed text-steel">
            Ce pseudo n&apos;est pas gravé dans le registre — tant mieux pour lui.
          </p>
        </div>
      ) : (
        <div className="border border-iron-line bg-iron">
          <div
            aria-hidden
            className="hidden grid-cols-[1fr_10rem_6rem_6rem_8rem_8rem_5rem] gap-4 border-b border-iron-line px-5 py-3 font-tech text-[9px] uppercase tracking-[0.22em] text-steel lg:grid"
          >
            <span>Nom</span>
            <span>Mort définitive</span>
            <span className="text-right">Kills</span>
            <span className="text-right">Morts</span>
            <span className="text-right">Meilleure série</span>
            <span className="text-right">Temps de jeu</span>
            <span className="text-right"> </span>
          </div>
          <ul>
            {pagePlayers.map((player) => (
              <li key={player.uuid} className="border-b border-iron-line/60 last:border-b-0">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5 lg:grid-cols-[1fr_10rem_6rem_6rem_8rem_8rem_5rem]">
                  <span className="flex min-w-0 items-center gap-3">
                    <img
                      src={avatarUrl(player.uuid)}
                      alt=""
                      width={32}
                      height={32}
                      loading="lazy"
                      className="h-8 w-8 border border-iron-line bg-ash-deep"
                    />
                    <PlayerLink
                      uuid={player.uuid}
                      className="truncate font-display text-base font-semibold text-bone hover:text-ember-glow"
                    >
                      {player.username}
                    </PlayerLink>
                  </span>
                  <span className="hidden text-sm text-steel lg:block">
                    {formatDeathDate(player.lastDeath)}
                  </span>
                  <span className="hidden text-right font-tech text-xs text-bone lg:block">
                    {player.kills}
                  </span>
                  <span className="hidden text-right font-tech text-xs text-bone lg:block">
                    {player.deaths}
                  </span>
                  <span className="hidden text-right font-tech text-xs text-bone lg:block">
                    {player.killStreak}
                  </span>
                  <span className="hidden text-right font-tech text-xs text-steel lg:block">
                    {formatPlaytime(player.playtime)}
                  </span>
                  <span className="text-right font-tech text-[10px] uppercase tracking-[0.2em] text-steel lg:hidden">
                    {formatDeathDate(player.lastDeath)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected(player)}
                    className="pressable justify-self-end font-tech text-[10px] uppercase tracking-[0.2em] text-ember-glow hover:text-bone"
                  >
                    Aperçu
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pageCount > 1 && (
        <nav
          aria-label="Pagination du registre"
          className="flex items-center justify-between gap-4"
        >
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className="pressable border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel enabled:hover:border-bone enabled:hover:text-bone disabled:opacity-40"
          >
            ← Précédent
          </button>
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            Page {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
            className="pressable border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel enabled:hover:border-bone enabled:hover:text-bone disabled:opacity-40"
          >
            Suivant →
          </button>
        </nav>
      )}

      {selected && <MemorialPanel player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function MemorialPanel({ player, onClose }: { player: DeadPlayer; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer la fiche"
        onClick={onClose}
        className="absolute inset-0 bg-ash-deep/85 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Fiche mémoriale de ${player.username}`}
        className="relative w-full max-w-md border border-iron-line bg-iron p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="pressable absolute right-4 top-4 border border-iron-line px-2.5 py-1 font-tech text-[10px] uppercase tracking-[0.2em] text-steel hover:border-bone hover:text-bone"
        >
          Fermer
        </button>

        <div className="flex flex-col items-start gap-6">
          <img
            src={avatarUrl(player.uuid)}
            alt={`Avatar de ${player.username}`}
            width={64}
            height={64}
            className="h-16 w-16 border border-iron-line bg-ash-deep"
          />
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-semibold text-bone">
                <PlayerLink uuid={player.uuid} className="hover:text-ember-glow">
                  {player.username}
                </PlayerLink>
              </h2>
              <Stamp tone="steel">Banni</Stamp>
            </div>
            <LifeNotches lives={0} />
            <p className="text-sm leading-relaxed text-steel">
              Mort définitive le {formatDeathDate(player.lastDeath)}. Trois encoches brisées —
              le registre garde le nom, le serveur garde le silence.
            </p>
            <Link
              href={playerProfilePath(player.uuid)}
              className="font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow hover:text-bone"
            >
              Profil complet →
            </Link>
          </div>

          <dl className="grid w-full grid-cols-2 gap-px border border-iron-line bg-iron-line">
            {(
              [
                { label: "Kills", value: String(player.kills) },
                { label: "Morts", value: String(player.deaths) },
                { label: "Meilleure série", value: String(player.killStreak) },
                { label: "Temps de jeu", value: formatPlaytime(player.playtime) },
              ] as const
            ).map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 bg-iron px-4 py-3.5">
                <dt className="font-tech text-[9px] uppercase tracking-[0.22em] text-steel">
                  {stat.label}
                </dt>
                <dd className="font-display text-lg font-semibold text-bone">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
