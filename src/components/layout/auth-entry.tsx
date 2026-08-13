"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthSummary = { connected: boolean; username?: string; linked?: boolean };

/**
 * Point d'entrée auth du header — composant client, interroge /api/auth/me
 * au montage. La lecture de session côté serveur forçait toutes les pages en
 * rendu dynamique : ce fetch client restaure le rendu statique des pages
 * vitrines. Pendant le chargement, un emplacement invisible réserve la
 * largeur du lien « Connexion » pour éviter tout décalage de mise en page.
 */
export function AuthEntry() {
  const [auth, setAuth] = useState<AuthSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store", signal: AbortSignal.timeout(4_000) })
      .then((res) => (res.ok ? (res.json() as Promise<AuthSummary>) : null))
      .then((data) => {
        if (!cancelled) setAuth(data ?? { connected: false });
      })
      .catch(() => {
        if (!cancelled) setAuth({ connected: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!auth) {
    return (
      <span aria-hidden className="invisible font-tech text-[11px] uppercase tracking-[0.22em]">
        Connexion
      </span>
    );
  }

  if (!auth.connected || !auth.username) {
    return (
      <Link
        href="/connexion"
        className="nav-link font-tech text-[11px] uppercase tracking-[0.22em] text-steel-light hover:text-bone"
      >
        Connexion
      </Link>
    );
  }

  return (
    <Link
      href="/connexion"
      className="flex items-center gap-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel-light transition-colors hover:text-bone"
    >
      {auth.linked && (
        <span
          aria-label="Compte Minecraft lié"
          title="Compte Minecraft lié"
          className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-ember-glow"
        />
      )}
      <span className="max-w-28 truncate">{auth.username}</span>
    </Link>
  );
}
