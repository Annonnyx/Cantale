/**
 * Remonte à chaque navigation App Router → rejoue l'entrée de page.
 * Fade + léger slide Y (~250ms). Désactivé via prefers-reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
