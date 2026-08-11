"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string };

/**
 * Menu « Plus » desktop — les pages secondaires (Règlement, Boutique, Stats,
 * La Liste) ne sont pas dans la barre principale ; sans ce contrôle elles
 * n'étaient accessibles que via le hamburger (masqué dès xl) ou le footer.
 */
export function DesktopMoreMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (links.length === 0) return null;

  return (
    <div ref={rootRef} className="relative hidden xl:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        className="nav-link font-tech text-[11px] uppercase tracking-[0.22em] text-steel-light hover:text-bone"
      >
        Plus
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Pages secondaires"
          className="menu-panel absolute right-0 top-full z-50 mt-3 min-w-[12.5rem] border border-iron-line bg-ash-deep/95 py-2 shadow-[var(--shadow-card-rest)] backdrop-blur-md"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="menu-link block px-4 py-3 font-tech text-[11px] uppercase tracking-[0.22em] text-steel-light hover:bg-iron hover:text-bone"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
