/** Chemin canonique du profil joueur (UUID Minecraft). */
export function playerProfilePath(uuid: string): string {
  return `/joueur/${uuid.trim().toLowerCase()}`;
}
