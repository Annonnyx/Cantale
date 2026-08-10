"use client";

import { useEffect, useState } from "react";

export type VoteSiteCardProps = {
  displayName: string;
  url: string;
  cooldownHours: number;
  crates: number;
  /** Dernier vote du joueur sur ce site, unix secondes. Null si jamais voté. */
  lastVoteAt: number | null;
  /** Minuteur affiché uniquement pour un compte lié avec base joignable. */
  personalized: boolean;
  /** Heure serveur au rendu, unix secondes — évite tout écart d'hydratation. */
  serverNow: number;
};

/** hh:mm:ss au-delà d'une heure, mm:ss en dessous. */
function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function rewardLabel(crates: number): string {
  return crates <= 1 ? "1× Cadeau du Roi" : `${crates}× Cadeaux du Roi`;
}

export function VoteSiteCard({
  displayName,
  url,
  cooldownHours,
  crates,
  lastVoteAt,
  personalized,
  serverNow,
}: VoteSiteCardProps) {
  const [nowSec, setNowSec] = useState(serverNow);

  useEffect(() => {
    if (!personalized) return;
    const tick = () => setNowSec(Math.floor(Date.now() / 1000));
    const immediate = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [personalized]);

  const availableAt = lastVoteAt === null ? null : lastVoteAt + cooldownHours * 3600;
  const available = availableAt === null || nowSec >= availableAt;
  const remaining = availableAt === null ? 0 : Math.max(0, availableAt - nowSec);

  return (
    <article className="card-soft flex flex-col gap-5 border border-iron-line bg-iron p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-xl font-semibold text-bone">{displayName}</h3>
        <span className="shrink-0 font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
          Toutes les {cooldownHours} h
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
          Récompense
        </span>
        <span className="font-display text-base font-semibold text-gold">
          {rewardLabel(crates)}
        </span>
      </div>

      {personalized && (
        <div className="flex flex-col gap-1 border-t border-iron-line/60 pt-4">
          <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
            Ton prochain vote
          </span>
          {available ? (
            <span className="font-tech text-xs uppercase tracking-[0.24em] text-ember-glow">
              Disponible
            </span>
          ) : (
            <span
              role="timer"
              aria-label={`Prochain vote possible dans ${formatRemaining(remaining)}`}
              className="font-tech text-sm tracking-[0.18em] text-bone"
            >
              {formatRemaining(remaining)}
            </span>
          )}
        </div>
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`pressable mt-auto inline-block self-start px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] ${
          !personalized || available
            ? "bg-ember text-bone hover:bg-ember-glow"
            : "border border-iron-line text-steel hover:border-bone hover:text-bone"
        }`}
      >
        Voter
      </a>
    </article>
  );
}
