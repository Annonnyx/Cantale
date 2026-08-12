"use client";

import { useEffect } from "react";

/**
 * Stabilise le scroll document :
 * - bloque les `<a href="#">` (Leaflet zoom, placeholders) qui sautent en haut/bas ;
 * - smooth scroll uniquement pour les ancres in-page réelles (`#id`), sans toucher
 *   à `html { scroll-behavior }` (incompatible avec le focus Leaflet / Next).
 */
export function ScrollStability() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Lien vide / hash seul → ne jamais laisser le navigateur déplacer le scroll.
      if (href === "#" || href === "/#") {
        event.preventDefault();
        return;
      }

      // Ancre in-page uniquement (pas /path#id — Next gère la navigation).
      if (!href.startsWith("#") || href.length < 2) return;
      if (anchor.hasAttribute("download") || anchor.target === "_blank") return;

      const id = decodeURIComponent(href.slice(1));
      const el = document.getElementById(id);
      if (!el) return;

      event.preventDefault();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (history.replaceState) {
        history.replaceState(null, "", href);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
