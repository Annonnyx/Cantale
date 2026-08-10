"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string };

export function MobileMenu({
  links,
  extraLinks,
  authLink,
}: {
  links: NavLink[];
  /** Liens secondaires (footer-like) — affichés sous un séparateur « Plus ». */
  extraLinks?: NavLink[];
  authLink?: NavLink;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="pressable flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-iron-line text-bone"
      >
        <span
          className={`h-px w-5 bg-current transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`h-px w-5 bg-current transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
        />
      </button>

      {open && (
        <nav
          aria-label="Navigation mobile"
          className="menu-panel absolute inset-x-0 top-16 border-b border-iron-line bg-ash-deep/95 backdrop-blur-md"
        >
          <ul className="flex flex-col px-6 py-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="menu-link block border-b border-iron-line/40 py-4 font-tech text-xs uppercase tracking-[0.25em] text-bone"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {extraLinks && extraLinks.length > 0 && (
              <>
                <li
                  aria-hidden
                  className="border-b border-iron-line/40 pb-2 pt-4 font-tech text-[10px] uppercase tracking-[0.28em] text-ember-glow"
                >
                  Plus
                </li>
                {extraLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="menu-link block border-b border-iron-line/40 py-4 font-tech text-xs uppercase tracking-[0.25em] text-steel-light"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </>
            )}
            {authLink && (
              <li>
                <Link
                  href={authLink.href}
                  onClick={() => setOpen(false)}
                  className="menu-link block border-b border-iron-line/40 py-4 font-tech text-xs uppercase tracking-[0.25em] text-bone"
                >
                  {authLink.label}
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/#rejoindre"
                onClick={() => setOpen(false)}
                className="menu-link block py-4 font-tech text-xs uppercase tracking-[0.25em] text-ember-glow"
              >
                Rejoindre
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
