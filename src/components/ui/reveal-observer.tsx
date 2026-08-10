"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Hydrate les blocs `.reveal` / `.reveal-stagger` déjà en place dans le DOM
 * (pages serveur) quand `animation-timeline: view()` n'est pas supporté.
 * Rejoue à chaque navigation App Router.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline", "view()")) {
      return;
    }

    const nodes = document.querySelectorAll<HTMLElement>(".reveal:not(.is-revealed)");
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    nodes.forEach((node) => {
      node.classList.add("reveal-io");
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
