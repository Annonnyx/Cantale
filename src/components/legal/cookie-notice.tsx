"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cantale_cookie_notice";

/**
 * Bandeau informatif uniquement : pas de trackers non essentiels → pas de mur
 * de consentement. Mémorise la fermeture en localStorage.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* private mode / blocked storage — show once per session */
    }
    if (dismissed) return;
    startTransition(() => setVisible(true));
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Information cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-iron-line bg-ash-deep/95 px-4 py-4 backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <p className="max-w-3xl text-sm leading-relaxed text-steel-light">
          Cookies techniques uniquement (connexion Discord / sécurité OAuth). Pas
          d&apos;analytics ni de pubs.{" "}
          <Link
            href="/cookies"
            className="text-bone underline decoration-iron-line underline-offset-4 hover:text-ember-glow"
          >
            En savoir plus
          </Link>
          {" · "}
          <Link
            href="/confidentialite"
            className="text-bone underline decoration-iron-line underline-offset-4 hover:text-ember-glow"
          >
            Confidentialité
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="pressable shrink-0 self-start border border-iron-line bg-iron px-4 py-2 font-tech text-[10px] uppercase tracking-[0.22em] text-bone hover:border-ember/60 sm:self-auto"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
