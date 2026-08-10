"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Décale l'entrée des enfants directs (cartes en grille). */
  stagger?: boolean;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsViewTimeline(): boolean {
  return typeof CSS !== "undefined" && CSS.supports("animation-timeline", "view()");
}

/**
 * Révélation au scroll via IntersectionObserver.
 * Complète le CSS `animation-timeline: view()` (déjà sur `.reveal`)
 * pour les navigateurs sans support, et permet un stagger enfants.
 */
export function Reveal({ children, className = "", stagger = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    if (supportsViewTimeline()) return;

    node.classList.add("reveal-io");

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

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = ["reveal", stagger ? "reveal-stagger" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  );
}
