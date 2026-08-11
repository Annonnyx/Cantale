import Link from "next/link";
import type { ReactNode } from "react";
import { playerProfilePath } from "@/lib/player-profile";

type Props = {
  uuid: string;
  children: ReactNode;
  className?: string;
  title?: string;
};

/** Lien vers le profil public `/joueur/[uuid]` (édition admin si session admin). */
export function PlayerLink({ uuid, children, className, title }: Props) {
  const id = uuid.trim();
  if (!id) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link
      href={playerProfilePath(id)}
      className={className}
      title={title ?? "Voir le profil"}
    >
      {children}
    </Link>
  );
}
